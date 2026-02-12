import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { computeMonthlyBurn, computeRunway, formatKoreanMoney } from '../lib/finance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';

export interface FinancialEditValues {
  cash: number;
  monthlyRevenue: number;
  employees: number;
  marketingCost: number;
  officeCost: number;
}

interface FinancialEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: FinancialEditValues;
  onSave: (values: FinancialEditValues) => void;
}

export function FinancialEditDialog({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: FinancialEditDialogProps) {
  const [cash, setCash] = useState('0');
  const [monthlyRevenue, setMonthlyRevenue] = useState('0');
  const [employees, setEmployees] = useState('0');
  const [marketingCost, setMarketingCost] = useState('0');
  const [officeCost, setOfficeCost] = useState('0');

  useEffect(() => {
    if (!open) return;
    setCash(String(initialValues.cash));
    setMonthlyRevenue(String(initialValues.monthlyRevenue));
    setEmployees(String(initialValues.employees));
    setMarketingCost(String(initialValues.marketingCost));
    setOfficeCost(String(initialValues.officeCost));
  }, [open, initialValues]);

  const parsedValues = useMemo(() => {
    const toNonNegative = (value: string) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.max(0, num);
    };

    const nextEmployees = Math.round(toNonNegative(employees));
    const nextMarketing = toNonNegative(marketingCost);
    const nextOffice = toNonNegative(officeCost);
    const nextCash = toNonNegative(cash);

    const nextBurn = computeMonthlyBurn(nextEmployees, nextMarketing, nextOffice);
    const nextRunway = computeRunway(nextCash, nextBurn);

    return {
      cash: nextCash,
      monthlyRevenue: toNonNegative(monthlyRevenue),
      employees: nextEmployees,
      marketingCost: nextMarketing,
      officeCost: nextOffice,
      burn: nextBurn,
      runway: nextRunway,
    };
  }, [cash, employees, marketingCost, monthlyRevenue, officeCost]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      cash: parsedValues.cash,
      monthlyRevenue: parsedValues.monthlyRevenue,
      employees: parsedValues.employees,
      marketingCost: parsedValues.marketingCost,
      officeCost: parsedValues.officeCost,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sg-panel-dark border-amber-600/70 bg-[#162540] p-5 text-amber-100 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="sg-heading">금고/비용 수정</DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            숫자는 원 단위로 입력하세요. 표시는 자동으로 만원 단위로 변환됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-amber-100">
              금고(현금)
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                value={cash}
                onChange={(e) => setCash(e.target.value)}
              />
            </label>

            <label className="text-xs font-bold text-amber-100">
              월 매출
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
              />
            </label>

            <label className="text-xs font-bold text-amber-100">
              직원 수
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                step={1}
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
              />
            </label>

            <label className="text-xs font-bold text-amber-100">
              마케팅 비용
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                value={marketingCost}
                onChange={(e) => setMarketingCost(e.target.value)}
              />
            </label>

            <label className="text-xs font-bold text-amber-100 sm:col-span-2">
              사무실 비용
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                value={officeCost}
                onChange={(e) => setOfficeCost(e.target.value)}
              />
            </label>
          </div>

          <div className="rounded-md border border-amber-700/60 bg-[#1b2d52] p-3 text-xs text-amber-100">
            <div>미리보기 금고: {formatKoreanMoney(parsedValues.cash)}</div>
            <div>미리보기 월 지출: {formatKoreanMoney(parsedValues.burn)}</div>
            <div>미리보기 런웨이: {parsedValues.runway.toFixed(1)}개월</div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="sg-btn sg-btn-secondary px-4 py-2 text-[11px] font-bold"
            >
              취소
            </button>
            <button
              type="submit"
              className="sg-btn sg-btn-success px-4 py-2 text-[11px] font-bold"
            >
              저장
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
