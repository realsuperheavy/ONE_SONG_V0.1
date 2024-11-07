import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { eventService } from '@/lib/firebase/services/event';

interface EventFormProps {
  onSuccess?: (eventId: string) => void;
}

export function EventForm({ onSuccess }: EventFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'wedding' | 'party' | 'corporate' | 'other'>('party');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const eventId = await eventService.createEvent({
        details: {
          name,
          description,
          venue,
          date,
          type
        }
      }, user.id);

      onSuccess?.(eventId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Event Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="venue" className="block text-sm font-medium">
          Venue
        </label>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium">
          Date
        </label>
        <input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Event Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        >
          <option value="party">Party</option>
          <option value="wedding">Wedding</option>
          <option value="corporate">Corporate</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
} 