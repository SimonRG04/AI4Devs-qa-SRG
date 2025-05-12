/* global cy, describe, it, beforeEach */

describe('Manejo de errores en la página de Posición', () => {
  beforeEach(() => {
    // Cargar las fases de la entrevista normalmente
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', { fixture: 'interviewFlow.json' }).as('getInterviewFlow');
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', { fixture: 'candidates.json' }).as('getCandidates');
  });

  it('Debería manejar correctamente errores al cargar las fases de entrevista', () => {
    // Interceptar con error la carga de fases
    cy.intercept('GET', 'http://localhost:3010/positions/*/interviewFlow', {
      statusCode: 500,
      body: {
        error: 'Error interno del servidor'
      }
    }).as('getInterviewFlowError');

    // Visitar la página
    cy.visit('/positions/1');
    cy.wait('@getInterviewFlowError');

    // Verificar que se muestra algún mensaje de error o estado vacío 
    // Nota: Esta verificación depende de cómo maneja la aplicación los errores
    // Podría verificarse que no hay columnas o que se muestra un mensaje de error específico
    cy.get('.card-header').should('not.exist');
  });

  it('Debería manejar correctamente errores al cargar los candidatos', () => {
    // Interceptar con error la carga de candidatos
    cy.intercept('GET', 'http://localhost:3010/positions/*/candidates', {
      statusCode: 500,
      body: {
        error: 'Error al cargar candidatos'
      }
    }).as('getCandidatesError');

    // Visitar la página
    cy.visit('/positions/1');
    cy.wait(['@getInterviewFlow', '@getCandidatesError']);

    // Verificar que las columnas se muestran (porque las fases se cargaron correctamente)
    cy.get('.card-header').should('have.length', 4);
    
    // Verificar que no hay candidatos en las columnas
    cy.get('.card-title').should('not.exist');
  });

  it('Debería manejar correctamente errores al actualizar un candidato', () => {
    // Cargar la página normalmente
    cy.intercept('PUT', 'http://localhost:3010/candidates/*', {}).as('updateCandidate');
    cy.visit('/positions/1');
    cy.wait(['@getInterviewFlow', '@getCandidates']);

    // Interceptar con error la actualización de candidatos
    cy.intercept('PUT', 'http://localhost:3010/candidates/*', {
      statusCode: 500,
      body: {
        error: 'Error al actualizar candidato'
      }
    }).as('updateCandidateError');

    // Intentar mover un candidato
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    cy.wait('@updateCandidateError');
    
    // Verificar comportamiento - depende de cómo la aplicación maneje estos errores
    // Idealmente, debería mostrar algún mensaje de error o restaurar el estado anterior
    // Como mínimo, podemos verificar que la aplicación no se bloquea después del error
    cy.get('.card-header').should('have.length', 4);
  });

  it('Debería manejar correctamente respuestas lentas del servidor', () => {
    // Simular respuesta lenta para la actualización de candidatos
    cy.intercept('PUT', 'http://localhost:3010/candidates/*', (req) => {
      // Retraso de 3 segundos
      req.on('response', (res) => {
        res.setDelay(3000);
      });
    }).as('slowUpdateCandidate');

    // Cargar la página normalmente
    cy.visit('/positions/1');
    cy.wait(['@getInterviewFlow', '@getCandidates']);

    // Mover candidato y verificar comportamiento durante la espera
    cy.moverCandidato('Juan Pérez', 'Entrevista Técnica');
    
    // Verificar que la interfaz sigue respondiendo mientras espera
    cy.get('.card-header').contains('Oferta').should('be.visible');
    
    // Esperar la respuesta lenta
    cy.wait('@slowUpdateCandidate', { timeout: 5000 });
    
    // Verificar que el cambio se aplicó después de la respuesta lenta
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent()
      .find('.card-title').should('contain', 'Juan Pérez');
  });
}); 