# Prompt inicial para Cursor utilizando Claude 3.7 modo Thinking para que obtenga el contexto de lo que estamos trabajando

Analiza el contexto del proyecto con el @README.md y el frontend @frontend

# Prompt para Cursor utilizando Claude 3.7 modo Thinking y Agent

Como experto en prompting, cypress, frontend y el contexto previamente obtenido construye un prompt para cumplir con los siguientes criterios:
---------
Debes crear pruebas E2E para verificar los siguientes escenarios:

Carga de la Página de Position:
Verifica que el título de la posición se muestra correctamente.
Verifica que se muestran las columnas correspondientes a cada fase del proceso de contratación.
Verifica que las tarjetas de los candidatos se muestran en la columna correcta según su fase actual.
Cambio de Fase de un Candidato:
Simula el arrastre de una tarjeta de candidato de una columna a otra.
Verifica que la tarjeta del candidato se mueve a la nueva columna.
Verifica que la fase del candidato se actualiza correctamente en el backend mediante el endpoint PUT /candidate/:id.
---------
El resultado esperado es un prompt en @prompts-SRG.md para cumplir con el objetivo.

# Prompt para Cursor utilizando Claude 3.7 modo Thinking y Agent

Como especialista en pruebas automatizadas con Cypress, necesito que desarrolles tests E2E robustos para nuestra aplicación de gestión de candidatos. El código debe ser limpio, mantenible y con assertions precisos.

## Contexto técnico
La aplicación permite gestionar candidatos en diferentes fases del proceso de contratación mediante un sistema de arrastrar y soltar (drag and drop). El componente principal es `PositionDetails.js` que utiliza react-beautiful-dnd para implementar esta funcionalidad. Los candidatos se muestran como tarjetas en columnas que representan cada fase del proceso.

## Especificaciones técnicas para los tests

```javascript
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
  });

  it('Verifica el cambio de fase de un candidato mediante drag and drop', () => {
    // Identificar el candidato y la columna de origen
    const dataTransfer = new DataTransfer();
    
    // Simular el drag and drop
    cy.get('.card-title').contains('Juan Pérez').parent().parent()
      .trigger('dragstart', { dataTransfer });
    
    // Obtener la columna de destino y hacer el drop
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent()
      .trigger('drop', { dataTransfer });
    
    // Verificar que la tarjeta se movió a la nueva columna
    cy.get('.card-header').contains('Entrevista Técnica').parent().parent()
      .find('.card-title').should('contain', 'Juan Pérez');
    
    // Verificar que se hizo la llamada al backend para actualizar
    cy.wait('@updateCandidate').its('request.body').should('deep.include', {
      currentInterviewStep: 2 // ID de la fase "Entrevista Técnica"
    });
  });
});
```

## Archivo de fixture: interviewFlow.json
```json
{
  "interviewFlow": {
    "positionName": "Desarrollador Frontend",
    "interviewFlow": {
      "interviewSteps": [
        { "id": 1, "name": "Aplicación" },
        { "id": 2, "name": "Entrevista Técnica" },
        { "id": 3, "name": "Entrevista RRHH" },
        { "id": 4, "name": "Oferta" }
      ]
    }
  }
}
```

## Archivo de fixture: candidates.json
```json
[
  {
    "candidateId": 1,
    "fullName": "Juan Pérez",
    "currentInterviewStep": "Aplicación",
    "averageScore": 3,
    "applicationId": 101
  },
  {
    "candidateId": 2,
    "fullName": "Ana García",
    "currentInterviewStep": "Entrevista Técnica",
    "averageScore": 4,
    "applicationId": 102
  },
  {
    "candidateId": 3,
    "fullName": "Carlos López",
    "currentInterviewStep": "Entrevista RRHH",
    "averageScore": 5,
    "applicationId": 103
  }
]
```

## Notas importantes:
1. La simulación de drag and drop en Cypress puede requerir plugins adicionales como `@4tw/cypress-drag-drop` para una implementación más precisa en caso de que el enfoque básico no funcione correctamente.
2. Asegúrate de configurar correctamente los archivos de fixture para simular las respuestas de la API.
3. Considera implementar comandos personalizados de Cypress para operaciones comunes como el drag and drop entre columnas.