import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { departmentThemes, DepartmentType } from '@/utils/departmentThemes';

interface DepartmentCardProps {
  department: DepartmentType;
  onClick: () => void;
  isSelected?: boolean;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onClick,
  isSelected = false
}) => {
  const theme = departmentThemes[department];

  return (
    <Card 
      className={`cursor-pointer hover-scale animate-fade-in ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className={`${theme.gradient} ${theme.shadow} p-6 text-center`}>
        <div className="text-4xl mb-3">
          {theme.icon}
        </div>
        <h3 className={`text-lg font-semibold ${theme.text}`}>
          {theme.name}
        </h3>
      </CardContent>
    </Card>
  );
};