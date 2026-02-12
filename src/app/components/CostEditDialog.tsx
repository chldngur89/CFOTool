import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  COST_PER_EMPLOYEE,
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

export type EditableCostTarget = 'personnel' | 'marketing' | 'office';
export interface CostEditValues {
  amount: number;
  employees?: number;
}

interface CostEditDialogProps {
  open: boolean;
  target: EditableCostTarget | null;
  initialAmount: number;
  initialEmployees: number;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CostEditValues) => void;
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

export function CostEditDialog({
  open,
  target,
  initialAmount,
  initialEmployees,
  onOpenChange,
  onSave,
}: CostEditDialogProps) {
  const [amountInput, setAmountInput] = useState('0');
  const [employeesInput, setEmployeesInput] = useState('0');

  useEffect(() => {
    if (!open) return;
    setAmountInput(initialAmount.toLocaleString('ko-KR'));
    setEmployeesInput(String(initialEmployees));
  }, [initialAmount, initialEmployees, open]);

  const parsedEmployees = useMemo(() => {
    const parsed = Number(employeesInput);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.round(parsed));
  }, [employeesInput]);

  const parsedAmount = useMemo(() => {
    if (target === 'personnel') {
      return parsedEmployees * COST_PER_EMPLOYEE;
    }
    return parseMoneyInput(amountInput);
  }, [amountInput, parsedEmployees, target]);

  const targetLabel =
    target === 'personnel'
      ? '인건비'
      : target === 'office'
        ? '사무실비'
        : '마케팅비';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      amount: parsedAmount,
      employees: target === 'personnel' ? parsedEmployees : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sg-panel-dark border-amber-600/70 bg-[#162540] p-5 text-amber-100 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="sg-heading">{targetLabel} 수정</DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            {target === 'personnel'
              ? `인건비는 직원 수 기준으로 자동 계산됩니다. (1인당 ${formatKoreanMoney(COST_PER_EMPLOYEE)})`
              : '원 단위 금액으로 입력하세요.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {target === 'personnel' && (
            <label className="block text-xs font-bold text-amber-100">
              직원 수
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="number"
                min={0}
                step={1}
                value={employeesInput}
                onChange={(e) => setEmployeesInput(e.target.value)}
              />
            </label>
          )}

          {target !== 'personnel' && (
            <label className="block text-xs font-bold text-amber-100">
              {targetLabel}
              <Input
                className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(formatMoneyInput(e.target.value))}
              />
            </label>
          )}

          <div className="rounded-md border border-amber-700/60 bg-[#1b2d52] p-3 text-xs text-amber-100">
            <div>적용 금액: {formatKoreanMoney(parsedAmount)}</div>
            {target === 'personnel' && (
              <div>적용 직원 수: {parsedEmployees}명 (300만원 x {parsedEmployees})</div>
            )}
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
