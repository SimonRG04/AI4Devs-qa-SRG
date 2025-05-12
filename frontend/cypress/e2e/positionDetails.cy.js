/* global cy, describe, it, beforeEach */

describe('Pruebas de la página de Posición', () => {
  beforeEach(() => {
    // Interceptar llamadas de API para tener datos consistentes
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('getInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', { fixture: 'candidates.json' }).as('getCandidates');
    cy.intercept('PUT', 'http://localhost:3010/candidates/*', {}).as('updateCandidate');
    
    // Visitar la página de detalles de posición
    cy.visit('/positions/1');
    cy.wait(['@getInterviewFlow', '@getCandidates']);
  });

  it('Verifica la carga correcta de la página de posición', () => {
    // Verificar título de posición
    cy.get('h2').should('contain', 'Desarrollador Frontend');
    
    // Verificar que se muestran todas las columnas de fases
    cy.get('.card-header').should('have.length', 4);
    cy.get('.card-header').eq(0).should('contain', 'Aplicación');
    cy.get('.card-header').eq(1).should('contain', 'Entrevista Técnica');
    cy.get('.card-header').eq(2).should('contain', 'Entrevista RRHH');
    cy.get('.card-header').eq(3).should('contain', 'Oferta');
    
    // Verificar que los candidatos están en las columnas correctas
    cy.get('.card-header').contains('Aplicación').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Ana García');
    cy.get('.card-header').contains('Entrevista RRHH').parent().parent().find('.card-title').should('contain', 'Carlos López');
  });

  it('Verifica el cambio de fase de un candidato mediante drag and drop', () => {
    // Interceptar la recarga de la página después de mover el candidato
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      // Generar una versión modificada de los candidatos con Juan Pérez en la nueva fase
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez", 
            currentInterviewStep: "Entrevista Técnica", // Ya movido a la nueva fase
            averageScore: 3,
            applicationId: 101
          },
          {
            candidateId: 2,
            fullName: "Ana García",
            currentInterviewStep: "Entrevista Técnica",
            averageScore: 4,
            applicationId: 102
          },
          {
            candidateId: 3,
            fullName: "Carlos López",
            currentInterviewStep: "Entrevista RRHH",
            averageScore: 5,
            applicationId: 103
          }
        ]
      });
    }).as('reloadCandidates');
    
    // Usar el comando personalizado para mover un candidato
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    
    // La función 'moverCandidato' ahora incluye una recarga de página, así que esperamos las nuevas peticiones
    cy.wait(['@reloadInterviewFlow', '@reloadCandidates'], { timeout: 10000 });
    
    // Verificar que después de la recarga el candidato aparece en la nueva columna
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent()
      .find('.card-title').should('contain', 'Juan Pérez');
  });

  it('Verifica el cambio de fase para otro candidato', () => {
    // Interceptar la recarga de la página después de mover el candidato
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      // Generar una versión modificada de los candidatos con Ana García en la nueva fase
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Aplicación",
            averageScore: 3,
            applicationId: 101
          },
          {
            candidateId: 2,
            fullName: "Ana García",
            currentInterviewStep: "Entrevista RRHH", // Ya movida a la nueva fase
            averageScore: 4,
            applicationId: 102
          },
          {
            candidateId: 3,
            fullName: "Carlos López",
            currentInterviewStep: "Entrevista RRHH",
            averageScore: 5,
            applicationId: 103
          }
        ]
      });
    }).as('reloadCandidates');
    
    // Mover Ana García a Entrevista RRHH
    cy.moverCandidato('Ana García', 'Entrevista RRHH');
    
    // Esperar la recarga de la página
    cy.wait(['@reloadInterviewFlow', '@reloadCandidates'], { timeout: 10000 });
    
    // Verificar que después de la recarga el candidato aparece en la nueva columna
    cy.get('.card-header').contains('Entrevista RRHH').parent().parent()
      .find('.card-title').should('contain', 'Ana García');
  });

  it('Verifica que se pueda acceder a los detalles de un candidato al hacer clic en su tarjeta', () => {
    // Hacer clic en la tarjeta del candidato
    cy.get('.card-title').contains('Juan Pérez').click();
    
    // Verificar que se muestra la información detallada del candidato
    cy.get('.offcanvas-title').should('exist');
    
    // Verificar que se puede cerrar la vista de detalles
    cy.get('.btn-close').click();
    cy.get('.offcanvas-title').should('not.exist');
  });

  it('Verifica que se pueda navegar de vuelta a la lista de posiciones', () => {
    // Verificar que el botón de volver existe
    cy.contains('Volver a Posiciones').should('exist');
    
    // Hacer clic en el botón de volver
    cy.contains('Volver a Posiciones').click();
    
    // Verificar que la navegación ocurrió correctamente
    cy.url().should('include', '/positions');
  });

  it('Verifica el comportamiento cuando un candidato llega a la fase final', () => {
    // Interceptar la recarga de la página después de mover el candidato
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      // Generar una versión modificada de los candidatos con Carlos López en la fase final
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Aplicación",
            averageScore: 3,
            applicationId: 101
          },
          {
            candidateId: 2,
            fullName: "Ana García",
            currentInterviewStep: "Entrevista Técnica",
            averageScore: 4,
            applicationId: 102
          },
          {
            candidateId: 3,
            fullName: "Carlos López",
            currentInterviewStep: "Oferta", // Ya movido a la fase final
            averageScore: 5,
            applicationId: 103
          }
        ]
      });
    }).as('reloadCandidates');
    
    // Mover candidato a la fase final
    cy.moverCandidato('Carlos López', 'Oferta');
    
    // Esperar la recarga de la página
    cy.wait(['@reloadInterviewFlow', '@reloadCandidates'], { timeout: 10000 });
    
    // Verificar que después de la recarga el candidato aparece en la nueva columna
    cy.get('.card-header').contains('Oferta').parent().parent()
      .find('.card-title').should('contain', 'Carlos López');
  });
}); 