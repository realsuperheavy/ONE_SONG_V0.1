import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthTabsProps } from './types';

export const AuthTabs: React.FC<AuthTabsProps> = ({ value, onChange }) => {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}; 