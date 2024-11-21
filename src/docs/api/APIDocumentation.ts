export const APIDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'OneSong API',
    version: '1.0.0',
    description: 'API for OneSong DJ and Event Management System',
  },
  paths: {
    '/events': {
      post: {
        summary: 'Create new event',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EventCreationRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Event created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Event'
                }
              }
            }
          }
        }
      }
    },
    '/events/{eventId}/requests': {
      post: {
        summary: 'Submit song request',
        parameters: [
          {
            name: 'eventId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SongRequest'
              }
            }
          }
        }
      }
    }
    // ... more endpoints
  }
}; 