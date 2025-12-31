import React from 'react';
import { Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type WeightUnit = 'g' | 'oz';

interface WeightInputProps {
  weight: string;
  unit: WeightUnit;
  onWeightChange: (weight: string) => void;
  onUnitChange: (unit: WeightUnit) => void;
  disabled?: boolean;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  weight,
  unit,
  onWeightChange,
  onUnitChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Known weight
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="e.g., 200"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            disabled={disabled}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={unit} onValueChange={(v) => onUnitChange(v as WeightUnit)} disabled={disabled}>
          <SelectTrigger className="w-20 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="g">g</SelectItem>
            <SelectItem value="oz">oz</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Adding weight dramatically improves accuracy
      </p>
    </div>
  );
};
