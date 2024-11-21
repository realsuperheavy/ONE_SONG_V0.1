export const DatabaseSchema = {
  collections: {
    events: {
      description: 'Stores event information',
      fields: {
        id: { type: 'string', description: 'Unique event identifier' },
        name: { type: 'string', description: 'Event name' },
        djId: { type: 'string', description: 'Reference to DJ user' },
        status: { 
          type: 'string',
          enum: ['draft', 'active', 'completed', 'cancelled'],
          description: 'Current event status'
        },
        settings: {
          type: 'object',
          properties: {
            allowRequests: { type: 'boolean' },
            requireApproval: { type: 'boolean' },
            tipEnabled: { type: 'boolean' }
          }
        }
      },
      indexes: [
        { fields: ['status', 'startTime'] },
        { fields: ['djId', 'status'] }
      ]
    },
    requests: {
      description: 'Song requests for events',
      fields: {
        id: { type: 'string' },
        eventId: { type: 'string' },
        userId: { type: 'string' },
        song: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            artist: { type: 'string' }
          }
        },
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected']
        },
        tip: {
          type: 'object',
          optional: true,
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' }
          }
        }
      }
    }
  },
  securityRules: {
    events: `
      allow read: if isAuthenticated();
      allow write: if isDJ() && isEventOwner(eventId);
    `,
    requests: `
      allow read: if isEventParticipant(eventId);
      allow create: if isAuthenticated() && isEventActive(eventId);
    `
  }
}; 