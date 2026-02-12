import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  COST_PER_EMPLOYEE,
  computeMonthlyBurn,
  computePersonnelCost,
  computeRunway,
  formatKoreanMoney,
} from '../lib/finance';
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

const sanitizeDigits = (value: string) => value.replace(/[^\d]/g, '');

const formatMoneyInput = (value: string) => {
  const digits = sanitizeDigits(value);
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
};

const parseMoneyInput = (value: string) => {
  const digits = sanitizeDigits(value);
  if (!digits) return 0;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

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
    setCash(initialValues.cash.toLocaleString('ko-KR'));
    setMonthlyRevenue(initialValues.monthlyRevenue.toLocaleString('ko-KR'));
    setEmployees(String(initialValues.employees));
    setMarketingCost(initialValues.marketingCost.toLocaleString('ko-KR'));
    setOfficeCost(initialValues.officeCost.toLocaleString('ko-KR'));
  }, [open, initialValues]);

  const parsedValues = useMemo(() => {
    const toNonNegativeInteger = (value: string) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return 0;
      return Math.max(0, num);
    };

    const nextEmployees = Math.round(toNonNegativeInteger(employees));
    const nextMarketing = parseMoneyInput(marketingCost);
    const nextOffice = parseMoneyInput(officeCost);
    const nextCash = parseMoneyInput(cash);
    const nextPersonnelCost = computePersonnelCost(nextEmployees, {
      unitCost: COST_PER_EMPLOYEE,
    });

    const nextBurn = computeMonthlyBurn(nextPersonnelCost, nextMarketing, nextOffice);
    const nextRunway = computeRunway(nextCash, nextBurn);

    return {
      cash: nextCash,
      monthlyRevenue: parseMoneyInput(monthlyRevenue),
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
            금액은 원 단위로 입력하세요. 예: 10,000은 1만원, 100,000,000은 1억원 형식으로 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-amber-100">
              금고(현금)
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="text"
                inputMode="numeric"
                value={cash}
                onChange={(e) => setCash(formatMoneyInput(e.target.value))}
              />
            </label>

            <label className="text-xs font-bold text-amber-100">
              월 매출
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="text"
                inputMode="numeric"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(formatMoneyInput(e.target.value))}
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
                type="text"
                inputMode="numeric"
                value={marketingCost}
                onChange={(e) => setMarketingCost(formatMoneyInput(e.target.value))}
              />
            </label>

            <label className="text-xs font-bold text-amber-100 sm:col-span-2">
              사무실 비용
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="text"
                inputMode="numeric"
                value={officeCost}
                onChange={(e) => setOfficeCost(formatMoneyInput(e.target.value))}
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
