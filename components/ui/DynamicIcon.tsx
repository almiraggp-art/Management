
import React from 'react';
import * as Icons from 'lucide-react';

type IconName = keyof typeof Icons;

interface DynamicIconProps extends Icons.LucideProps {
  name?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = Icons[name as IconName] as React.ElementType;

  if (!IconComponent || typeof name !== 'string') {
    return <Icons.Package {...props} />; // Fallback icon
  }

  return <IconComponent {...props} />;
};
