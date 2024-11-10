import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, Users } from 'lucide-react';

interface AuthTabsProps {
  activeMethod: 'email' | 'phone' | 'social';
  onMethodChange: (method: 'email' | 'phone' | 'social') => void;
}

export function AuthTabs({ activeMethod, onMethodChange }: AuthTabsProps) {
  return (
    <Tabs 
      value={activeMethod} 
      onValueChange={(value: string) => onMethodChange(value as 'email' | 'phone' | 'social')}
    >
      <TabsList className="grid grid-cols-3 w-full bg-[#2E2F2E]">
        <TabsTrigger
          value="email"
          className={`flex items-center gap-2 ${
            activeMethod === 'email' ? 'text-[#F49620]' : 'text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </TabsTrigger>
        <TabsTrigger
          value="phone"
          className={`flex items-center gap-2 ${
            activeMethod === 'phone' ? 'text-[#F49620]' : 'text-white'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Phone</span>
        </TabsTrigger>
        <TabsTrigger
          value="social"
          className={`flex items-center gap-2 ${
            activeMethod === 'social' ? 'text-[#F49620]' : 'text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Social</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}