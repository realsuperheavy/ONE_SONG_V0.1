service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // Add missing compound index
      allow read: if isAuthenticated();
      allow write: if isDJ() && isEventOwner(eventId);
      
      // Add index for common query pattern
      index('active_events') {
        fields: ['status', 'startTime', 'djId'];
      }
    }
  }
} 