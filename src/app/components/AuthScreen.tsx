import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import { RepresentativeCharacter } from './character/RepresentativeCharacter';
import type { RepresentativeVariant } from './character/CharacterChoiceScreen';
import { supabase } from '../lib/supabase';
import { upsertCfoProfile } from '../lib/cfoProfile';

type AuthMode = 'signin' | 'signup';

export interface LocalSignupPayload {
  email: string;
  fullName: string;
  companyName: string;
  representativeVariant: RepresentativeVariant;
}

interface AuthScreenProps {
  localMode?: boolean;
  forceSignup?: boolean;
  initialLocalProfile?: {
    fullName?: string;
    companyName?: string;
    representativeVariant?: RepresentativeVariant;
  };
  onLocalSignup?: (payload: LocalSignupPayload) => void;
}

export function AuthScreen({
  localMode = false,
  forceSignup = false,
  initialLocalProfile,
  onLocalSignup,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [fullName, setFullName] = useState(initialLocalProfile?.fullName ?? '');
  const [companyName, setCompanyName] = useState(initialLocalProfile?.companyName ?? '');
  const [variant, setVariant] = useState<RepresentativeVariant>(
    initialLocalProfile?.representativeVariant === 'general' ? 'general' : 'strategist'
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (!email.trim() || (!localMode && !password.trim())) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      if (isSignup) {
        if (!localMode && password !== passwordConfirm) {
          throw new Error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        }

        if (!fullName.trim() || !companyName.trim()) {
          throw new Error('성함과 회사명을 입력해주세요.');
        }

        if (localMode && !supabase) {
          onLocalSignup?.({
            email: email.trim(),
            fullName: fullName.trim(),
            companyName: companyName.trim(),
            representativeVariant: variant,
          });
          return;
        }

        if (!supabase) {
          throw new Error('Supabase가 설정되지 않았습니다.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: fullName.trim(),
              full_name: fullName.trim(),
              company_name: companyName.trim(),
              representative_variant: variant,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user && data.session) {
          await upsertCfoProfile({
            userId: data.user.id,
            email: data.user.email,
            fullName,
            companyName,
          });
        }

        if (!data.session) {
          const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (!signInAfterSignUpError) {
            setNotice('회원가입이 완료되어 자동 로그인되었습니다.');
            return;
          }

          setNotice('가입 확인 메일을 보냈습니다. 메일 인증 후 로그인해주세요.');
          setMode('signin');
        }
      } else {
        if (!supabase) {
          throw new Error('Supabase가 설정되지 않았습니다.');
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[84vh] max-w-3xl items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sg-panel-dark w-full p-5 md:p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="sg-heading">CFO 성 방어전 시작</h1>
            <p className="sg-subtitle mt-2">
              {localMode
                ? '로컬 개발 모드: 회원가입 정보를 입력하면 바로 시작합니다.'
                : isSignup
                ? '회원가입 시 대표 캐릭터와 회사 정보를 설정합니다.'
                : '로그인 후 마지막으로 보던 시뮬레이션을 이어서 확인합니다.'}
            </p>
          </div>
          <div className="sg-chip">{isSignup ? '회원가입' : '로그인'}</div>
        </div>

        {!forceSignup && (
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setNotice(null);
              }}
              className={`sg-btn px-4 py-2 text-[11px] font-bold ${isSignup ? 'sg-btn-primary' : 'sg-btn-secondary'}`}
            >
              회원가입
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setNotice(null);
              }}
              className={`sg-btn px-4 py-2 text-[11px] font-bold ${!isSignup ? 'sg-btn-primary' : 'sg-btn-secondary'}`}
            >
              로그인
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-bold text-amber-100">
            이메일
            <Input
              type="email"
              autoComplete="email"
              className="mt-1 border-amber-700/70 bg-[#1d3159] text-amber-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-xs font-bold text-amber-100">
            비밀번호
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="border-amber-700/70 bg-[#1d3159] pr-16 text-amber-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={localMode}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={localMode}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-amber-700/70 bg-[#223964] px-2 py-0.5 text-[10px] font-bold text-amber-100 disabled:opacity-40"
              >
                {showPassword ? '숨김' : '표시'}
              </button>
            </div>
          </label>

          {isSignup && (
            <>
              <label className="block text-xs font-bold text-amber-100">
                비밀번호 확인
                <div className="relative mt-1">
                  <Input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="border-amber-700/70 bg-[#1d3159] pr-16 text-amber-100"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={localMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    disabled={localMode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-amber-700/70 bg-[#223964] px-2 py-0.5 text-[10px] font-bold text-amber-100 disabled:opacity-40"
                  >
                    {showPasswordConfirm ? '숨김' : '표시'}
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block text-xs font-bold text-amber-100">
                  대표 성함
                  <Input
                    className="mt-1 border-amber-700/70 bg-[#1d3159] text-amber-100"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="홍길동"
                  />
                </label>

                <label className="block text-xs font-bold text-amber-100">
                  회사명
                  <Input
                    className="mt-1 border-amber-700/70 bg-[#1d3159] text-amber-100"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="OO테크"
                  />
                </label>
              </div>

              <div className="rounded-md border border-amber-700/60 bg-[#172746] p-3">
                <div className="mb-3 text-xs font-bold text-amber-100">대표 캐릭터 선택</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVariant('strategist')}
                    className={`rounded-md border p-3 text-center ${variant === 'strategist' ? 'border-amber-400 bg-[#253968]' : 'border-amber-800/70 bg-[#1a2946]'}`}
                  >
                    <div className="mb-2 flex justify-center">
                      <RepresentativeCharacter variant="strategist" size={72} />
                    </div>
                    <div className="text-xs font-bold text-amber-100">책사</div>
                    <div className="mt-1 text-[10px] text-slate-300">난세를 읽는 지략가</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVariant('general')}
                    className={`rounded-md border p-3 text-center ${variant === 'general' ? 'border-amber-400 bg-[#253968]' : 'border-amber-800/70 bg-[#1a2946]'}`}
                  >
                    <div className="mb-2 flex justify-center">
                      <RepresentativeCharacter variant="general" size={72} />
                    </div>
                    <div className="text-xs font-bold text-amber-100">장군</div>
                    <div className="mt-1 text-[10px] text-slate-300">돌파를 이끄는 결단가</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md border border-red-800/80 bg-red-900/30 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-md border border-emerald-700/80 bg-emerald-900/30 px-3 py-2 text-xs text-emerald-200">
              {notice}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="sg-btn sg-btn-success w-full px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? '처리 중...'
                : localMode
                  ? '로컬 회원가입 후 시작'
                  : isSignup
                    ? '회원가입하고 시작하기'
                    : '로그인'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
