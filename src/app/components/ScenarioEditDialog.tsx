import { useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export type EditableScenarioId = 'defense' | 'attack';

export interface ScenarioCardCopy {
  title: string;
  description: string;
  effect: string;
  detail: string;
}

interface ScenarioEditDialogProps {
  open: boolean;
  scenarioId: EditableScenarioId | null;
  initialCopy: ScenarioCardCopy | null;
  onOpenChange: (open: boolean) => void;
  onSave: (scenarioId: EditableScenarioId, copy: ScenarioCardCopy) => void;
}

export function ScenarioEditDialog({
  open,
  scenarioId,
  initialCopy,
  onOpenChange,
  onSave,
}: ScenarioEditDialogProps) {
  const FIXED_ATTACK_TITLE = '공격적 선택';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!open || !initialCopy) return;
    setTitle(scenarioId === 'attack' ? FIXED_ATTACK_TITLE : initialCopy.title);
    setDescription(initialCopy.description);
    setEffect(initialCopy.effect);
    setDetail(initialCopy.detail);
  }, [open, initialCopy, scenarioId]);

  const modeTitle =
    scenarioId === 'defense'
      ? '방어적 선택 수정'
      : scenarioId === 'attack'
        ? '공격적 선택 수정'
        : '전략 문구 수정';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scenarioId) return;

    onSave(scenarioId, {
      title:
        scenarioId === 'attack'
          ? FIXED_ATTACK_TITLE
          : title.trim() || '방어적 선택',
      description: description.trim() || '-',
      effect: effect.trim() || '-',
      detail: detail.trim() || '-',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sg-panel-dark border-amber-600/70 bg-[#162540] p-5 text-amber-100 sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="sg-heading">{modeTitle}</DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            카드 문구를 수정해 팀 전략 톤을 맞출 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-bold text-amber-100">
            제목
            <Input
              className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={24}
              disabled={scenarioId === 'attack'}
            />
            {scenarioId === 'attack' && (
              <div className="mt-1 text-[10px] text-slate-300">
                공격적 선택 제목은 고정됩니다.
              </div>
            )}
          </label>

          <label className="block text-xs font-bold text-amber-100">
            설명
            <Input
              className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={40}
            />
          </label>

          <label className="block text-xs font-bold text-amber-100">
            예상 효과
            <Input
              className="mt-1 border-amber-700/70 bg-[#1e315a] text-amber-100"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              maxLength={40}
            />
          </label>

          <label className="block text-xs font-bold text-amber-100">
            상세 문구
            <Textarea
              className="mt-1 min-h-20 border-amber-700/70 bg-[#1e315a] text-amber-100"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={80}
            />
          </label>

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
