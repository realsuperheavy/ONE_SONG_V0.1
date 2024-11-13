import { STATUS_COLORS } from '@/constants/status';

interface RequestCardProps {
  request: SongRequest;
  showVoting?: boolean;
  showUserInfo?: boolean;
  onVote?: (requestId: string) => Promise<void>;
  onRemove?: (requestId: string) => Promise<void>;
}

export function RequestCard({ 
  request, 
  showVoting = true,
  showUserInfo = false,
  onVote,
  onRemove 
}: RequestCardProps) {
  // ... consolidated implementation
} 