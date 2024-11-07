import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { requestService } from '@/lib/firebase/services/request';
import { SongRequest } from '@/types/models';

interface RequestFormProps {
  eventId: string;
  song: {
    id: string;
    title: string;
    artist: string;
    albumArt?: string;
    duration: number;
    previewUrl?: string;
  };
  onSuccess?: () => void;
}

export function RequestForm({ eventId, song, onSuccess }: RequestFormProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await requestService.createRequest({
        eventId,
        userId: user.id,
        song,
        metadata: {
          message,
          requestTime: new Date().toISOString(),
          votes: 0
        }
      });

      onSuccess?.();
      setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message (optional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
          placeholder="Add a message to your request..."
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? 'Sending Request...' : 'Send Request'}
      </button>
    </form>
  );
} 