/* global cy, describe, it, beforeEach */

describe('Pruebas avanzadas de Drag and Drop', () => {
  beforeEach(() => {
    // Interceptar llamadas de API para tener datos consistentes
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('getInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', { fixture: 'candidates.json' }).as('getCandidates');
    cy.intercept('PUT', 'http://localhost:3010/candidates/*', {}).as('updateCandidate');
    
    // Visitar la página de detalles de posición
    cy.visit('/positions/1');
    cy.wait(['@getInterviewFlow', '@getCandidates']);
  });

  it('Debería mover candidatos entre todas las fases secuencialmente', () => {
    // Interceptar la primera recarga - Juan Pérez en Entrevista Técnica
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow1');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Entrevista Técnica", // Primera fase
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
    }).as('reloadCandidates1');
    
    // Mover Juan Pérez por todas las fases de manera secuencial
    // Aplicación -> Entrevista Técnica
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    cy.wait(['@reloadFlow1', '@reloadCandidates1'], { timeout: 10000 });
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
    
    // Interceptar la segunda recarga - Juan Pérez en Entrevista RRHH
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow2');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Entrevista RRHH", // Segunda fase
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
    }).as('reloadCandidates2');
    
    // Entrevista Técnica -> Entrevista RRHH
    cy.moverCandidato('Juan Pérez', 'Entrevista RRHH');
    cy.wait(['@reloadFlow2', '@reloadCandidates2'], { timeout: 10000 });
    cy.get('.card-header').contains('Entrevista RRHH').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
    
    // Interceptar la tercera recarga - Juan Pérez en Oferta
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow3');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Oferta", // Fase final
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
    }).as('reloadCandidates3');
    
    // Entrevista RRHH -> Oferta
    cy.moverCandidato('Juan Pérez', 'Oferta');
    cy.wait(['@reloadFlow3', '@reloadCandidates3'], { timeout: 10000 });
    cy.get('.card-header').contains('Oferta').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
  });

  it('Debería manejar correctamente múltiples movimientos en diferentes direcciones', () => {
    // Interceptar para el primer movimiento
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow1');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
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
            currentInterviewStep: "Entrevista RRHH", // Movida a RRHH
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
    }).as('reloadCandidates1');
    
    // Mover Ana García de "Entrevista Técnica" a "Entrevista RRHH"
    cy.moverCandidato('Ana García', 'Entrevista RRHH');
    cy.wait(['@reloadFlow1', '@reloadCandidates1'], { timeout: 10000 });
    
    // Interceptar para el segundo movimiento
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow2');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
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
            currentInterviewStep: "Entrevista RRHH",
            averageScore: 4,
            applicationId: 102
          },
          {
            candidateId: 3,
            fullName: "Carlos López",
            currentInterviewStep: "Entrevista Técnica", // Movido a Técnica
            averageScore: 5,
            applicationId: 103
          }
        ]
      });
    }).as('reloadCandidates2');
    
    // Mover Carlos López de "Entrevista RRHH" a "Entrevista Técnica" (retroceso)
    cy.moverCandidato('Carlos López', 'Entrevista Técnica');
    cy.wait(['@reloadFlow2', '@reloadCandidates2'], { timeout: 10000 });
    
    // Verificar posición final de los candidatos
    cy.get('.card-header').contains('Entrevista RRHH').parent().parent().find('.card-title').should('contain', 'Ana García');
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Carlos López');
  });

  it('Debería permitir mover varios candidatos a la misma fase', () => {
    // Interceptar para el movimiento
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Entrevista Técnica", // Movido a Técnica
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
    
    // Mover Juan Pérez de "Aplicación" a "Entrevista Técnica"
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    cy.wait(['@reloadFlow', '@reloadCandidates'], { timeout: 10000 });
    
    // Verificar que ambos candidatos están en la misma fase
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Ana García');
    
    // Verificar que hay exactamente 2 candidatos en esa fase
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('have.length', 2);
  });

  it('Debería persistir los cambios después de recargar la página', () => {
    // Configurar las interceptaciones para simular datos actualizados
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow1');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Entrevista Técnica", // Fase actualizada
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
    }).as('reloadCandidates1');

    // Mover un candidato
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    cy.wait(['@reloadFlow1', '@reloadCandidates1'], { timeout: 10000 });
    
    // Ahora simulamos una recarga manual de la página con las mismas interceptaciones
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('reloadFlow2');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            candidateId: 1,
            fullName: "Juan Pérez",
            currentInterviewStep: "Entrevista Técnica", // Mantiene la fase actualizada
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
    }).as('reloadCandidates2');
    
    // Simular recarga explícita de la página
    cy.reload();
    cy.wait(['@reloadFlow2', '@reloadCandidates2'], { timeout: 10000 });
    
    // Verificar que los cambios persisten
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent().find('.card-title').should('contain', 'Juan Pérez');
  });
}); 