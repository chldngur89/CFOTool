import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CastleDefense } from './components/CastleDefense';
import { AuthScreen, type LocalSignupPayload } from './components/AuthScreen';
import type { RepresentativeVariant } from './components/character/CharacterChoiceScreen';
import {
  fetchCfoProfile,
  getPreferredVariant,
  getProfileFromMetadata,
  updateLastWorkspaceId,
  upsertCfoProfile,
} from './lib/cfoProfile';
import {
  checkSupabaseAvailability,
  clearSupabaseAuthStorage,
  getSupabaseClient,
  isSupabaseConfigured,
} from './lib/supabase';

interface ViewerProfile {
  fullName: string;
  companyName: string;
  representativeVariant: RepresentativeVariant;
  lastWorkspaceId: string | null;
}

type RemoteMode = 'disabled' | 'checking' | 'ready' | 'fallback';

const LOCAL_PROFILE_KEY = 'cfo_local_profile';
const LOCAL_DEFAULT_PROFILE: ViewerProfile = {
  fullName: '게스트 대표',
  companyName: '게스트 전장',
  representativeVariant: 'strategist',
  lastWorkspaceId: null,
};

function readLocalProfile(): ViewerProfile {
  if (typeof window === 'undefined') return LOCAL_DEFAULT_PROFILE;

  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return LOCAL_DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<ViewerProfile>;
    return {
      fullName:
        typeof parsed.fullName === 'string' && parsed.fullName.trim()
          ? parsed.fullName.trim()
          : LOCAL_DEFAULT_PROFILE.fullName,
      companyName:
        typeof parsed.companyName === 'string' && parsed.companyName.trim()
          ? parsed.companyName.trim()
          : LOCAL_DEFAULT_PROFILE.companyName,
      representativeVariant:
        parsed.representativeVariant === 'general' ? 'general' : 'strategist',
      lastWorkspaceId:
        typeof parsed.lastWorkspaceId === 'string' ? parsed.lastWorkspaceId : null,
    };
  } catch {
    return LOCAL_DEFAULT_PROFILE;
  }
}

function writeLocalProfile(profile: ViewerProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export default function App() {
  const isLocalDev = import.meta.env.DEV;
  const [remoteMode, setRemoteMode] = useState<RemoteMode>(
    isSupabaseConfigured ? 'checking' : 'disabled'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<ViewerProfile>(() =>
    readLocalProfile()
  );
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setRemoteMode('disabled');
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const bootstrapSupabase = async () => {
      setRemoteMode('checking');
      setAuthLoading(true);

      const available = await checkSupabaseAvailability({ force: true });
      if (!mounted) return;

      if (!available) {
        clearSupabaseAuthStorage();
        setSession(null);
        setViewerProfile(null);
        setProfileSyncError(null);
        setRemoteMode('fallback');
        setAuthLoading(false);
        setShowAuthScreen(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setRemoteMode('fallback');
        setAuthLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);
        setRemoteMode('ready');
        setAuthLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_, nextSession) => {
          setSession(nextSession);
          setAuthLoading(false);
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.warn('[Supabase] session bootstrap failed:', error);
        clearSupabaseAuthStorage();
        if (!mounted) return;
        setSession(null);
        setViewerProfile(null);
        setProfileSyncError(null);
        setRemoteMode('fallback');
        setAuthLoading(false);
      }
    };

    void bootstrapSupabase();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (remoteMode !== 'ready' || !session?.user) {
      setViewerProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    const syncProfile = async () => {
      const metadataProfile = getProfileFromMetadata(session.user);
      const metadataVariant = getPreferredVariant(session.user);

      try {
        await upsertCfoProfile({
          userId: session.user.id,
          email: session.user.email,
          fullName: metadataProfile.fullName,
          companyName: metadataProfile.companyName,
        });

        const dbProfile = await fetchCfoProfile(session.user.id);
        if (cancelled) return;

        setViewerProfile({
          fullName: dbProfile?.fullName || metadataProfile.fullName,
          companyName: dbProfile?.companyName || metadataProfile.companyName,
          representativeVariant: metadataVariant,
          lastWorkspaceId: dbProfile?.lastWorkspaceId ?? null,
        });
        setProfileSyncError(null);
      } catch {
        if (cancelled) return;

        setViewerProfile({
          fullName: metadataProfile.fullName,
          companyName: metadataProfile.companyName,
          representativeVariant: metadataVariant,
          lastWorkspaceId: null,
        });
        setProfileSyncError('프로필 동기화에 일시적으로 실패했습니다.');
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [remoteMode, session?.user?.id]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || remoteMode !== 'ready') return;
    await supabase.auth.signOut();
  };

  const handleRepresentativeVariantPersist = async (variant: RepresentativeVariant) => {
    if (remoteMode !== 'ready' || !session?.user) {
      setLocalProfile((prev) => {
        const next = {
          ...prev,
          representativeVariant: variant,
        };
        writeLocalProfile(next);
        return next;
      });
      return;
    }

    setViewerProfile((prev) =>
      prev
        ? {
            ...prev,
            representativeVariant: variant,
          }
        : prev
    );

    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.auth.updateUser({
      data: {
        representative_variant: variant,
      },
    });

    await upsertCfoProfile({
      userId: session.user.id,
      email: session.user.email,
      fullName: viewerProfile?.fullName,
      companyName: viewerProfile?.companyName,
      lastWorkspaceId: viewerProfile?.lastWorkspaceId ?? null,
      representativeVariant: variant,
    });
  };

  const handleWorkspaceResolved = async (workspaceId: string) => {
    if (!workspaceId) return;

    setViewerProfile((prev) =>
      prev
        ? {
            ...prev,
            lastWorkspaceId: workspaceId,
          }
        : prev
    );

    if (remoteMode !== 'ready' || !session?.user) return;
    await updateLastWorkspaceId(session.user.id, workspaceId);
  };

  const handleLocalSignup = (payload: LocalSignupPayload) => {
    const nextProfile: ViewerProfile = {
      fullName: payload.fullName,
      companyName: payload.companyName,
      representativeVariant: payload.representativeVariant,
      lastWorkspaceId: localProfile.lastWorkspaceId,
    };
    setLocalProfile(nextProfile);
    writeLocalProfile(nextProfile);
    setShowAuthScreen(false);
  };

  const renderGuestShell = ({
    authLabel,
    onAuthClick,
    banner,
  }: {
    authLabel?: string;
    onAuthClick?: () => void;
    banner?: string;
  }) => (
    <div className="sg-shell antialiased">
      <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <div className="sg-chip">
            게스트 모드 · {localProfile.companyName} · {localProfile.fullName}
          </div>
          {authLabel && onAuthClick && (
            <button
              type="button"
              onClick={onAuthClick}
              className="sg-btn sg-btn-secondary px-3 py-1.5 text-[10px] font-bold"
            >
              {authLabel}
            </button>
          )}
        </div>

        {banner && (
          <div className="mb-3 rounded-md border border-amber-700/80 bg-amber-900/25 px-3 py-2 text-xs text-amber-100">
            {banner}
          </div>
        )}

        <CastleDefense
          userDisplayName={localProfile.fullName}
          companyName={localProfile.companyName}
          initialRepresentativeVariant={localProfile.representativeVariant}
          onRepresentativeVariantPersist={handleRepresentativeVariantPersist}
          initialWorkspaceId={localProfile.lastWorkspaceId}
        />
      </div>
    </div>
  );

  if (remoteMode === 'disabled') {
    if (showAuthScreen && isLocalDev) {
      return (
        <div className="sg-shell antialiased">
          <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuthScreen(false)}
                className="sg-btn sg-btn-secondary px-3 py-1.5 text-[10px] font-bold"
              >
                게스트 화면으로 돌아가기
              </button>
            </div>
            <AuthScreen
              localMode
              forceSignup
              initialLocalProfile={localProfile}
              onLocalSignup={handleLocalSignup}
            />
          </div>
        </div>
      );
    }

    return renderGuestShell({
      authLabel: isLocalDev ? '회원가입 화면' : undefined,
      onAuthClick: isLocalDev ? () => setShowAuthScreen(true) : undefined,
      banner: isLocalDev
        ? '로컬 모드로 바로 진입했습니다. 필요할 때만 회원가입 화면으로 이동할 수 있습니다.'
        : 'Supabase 설정이 없어 게스트 모드로 실행 중입니다.',
    });
  }

  if (remoteMode === 'fallback') {
    return renderGuestShell({
      banner:
        'Supabase 주소에 연결할 수 없어 게스트 모드로 전환했습니다. Vercel 환경변수의 Project URL과 키를 다시 확인하세요.',
    });
  }

  if (remoteMode === 'checking' || authLoading || (session && profileLoading)) {
    return (
      <div className="sg-shell antialiased">
        <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
          <div className="sg-panel-dark mx-auto mt-16 max-w-xl p-6 text-center">
            <h2 className="sg-heading">불러오는 중...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!session && showAuthScreen) {
    return (
      <div className="sg-shell antialiased">
        <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowAuthScreen(false)}
              className="sg-btn sg-btn-secondary px-3 py-1.5 text-[10px] font-bold"
            >
              게스트 화면으로 돌아가기
            </button>
          </div>
          <AuthScreen />
        </div>
      </div>
    );
  }

  if (!session) {
    return renderGuestShell({
      authLabel: '회원가입/로그인',
      onAuthClick: () => setShowAuthScreen(true),
      banner:
        'DB 연결 이슈가 있어도 첫 화면은 바로 진입하도록 변경했습니다. 계정 연동이 필요할 때만 회원가입 화면으로 이동하면 됩니다.',
    });
  }

  return (
    <div className="sg-shell antialiased">
      <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <div className="sg-chip">
            {viewerProfile?.companyName || '회사 미입력'} · {viewerProfile?.fullName || '대표'}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="sg-btn sg-btn-secondary px-3 py-1.5 text-[10px] font-bold"
          >
            로그아웃
          </button>
        </div>

        {profileSyncError && (
          <div className="mb-3 rounded-md border border-amber-700/80 bg-amber-900/25 px-3 py-2 text-xs text-amber-100">
            {profileSyncError}
          </div>
        )}

        <CastleDefense
          userDisplayName={viewerProfile?.fullName}
          companyName={viewerProfile?.companyName}
          initialRepresentativeVariant={viewerProfile?.representativeVariant}
          initialWorkspaceId={viewerProfile?.lastWorkspaceId ?? null}
          userId={session.user.id}
          onRepresentativeVariantPersist={handleRepresentativeVariantPersist}
          onWorkspaceResolved={handleWorkspaceResolved}
        />
      </div>
    </div>
  );
}
