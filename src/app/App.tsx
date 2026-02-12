import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CastleDefense } from './components/CastleDefense';
import { AuthScreen, type LocalSignupPayload } from './components/AuthScreen';
import type { RepresentativeVariant } from './components/character/CharacterChoiceScreen';
import {
  fetchCfoProfile,
  getPreferredVariant,
  getProfileFromMetadata,
  upsertCfoProfile,
} from './lib/cfoProfile';
import { isSupabaseConfigured, supabase } from './lib/supabase';

interface ViewerProfile {
  fullName: string;
  companyName: string;
  representativeVariant: RepresentativeVariant;
}

const LOCAL_PROFILE_KEY = 'cfo_local_profile';
const LOCAL_DEFAULT_PROFILE: ViewerProfile = {
  fullName: '로컬 대표',
  companyName: '로컬 테스트',
  representativeVariant: 'strategist',
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
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<ViewerProfile>(() =>
    readLocalProfile()
  );
  const [localSignedIn, setLocalSignedIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
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
        });
        setProfileSyncError(null);
      } catch {
        if (cancelled) return;

        setViewerProfile({
          fullName: metadataProfile.fullName,
          companyName: metadataProfile.companyName,
          representativeVariant: metadataVariant,
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
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleRepresentativeVariantPersist = async (variant: RepresentativeVariant) => {
    if (!isSupabaseConfigured) {
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

    if (!supabase) return;
    await supabase.auth.updateUser({
      data: {
        representative_variant: variant,
      },
    });
  };

  const handleLocalSignup = (payload: LocalSignupPayload) => {
    const nextProfile: ViewerProfile = {
      fullName: payload.fullName,
      companyName: payload.companyName,
      representativeVariant: payload.representativeVariant,
    };
    setLocalProfile(nextProfile);
    writeLocalProfile(nextProfile);
    setLocalSignedIn(true);
  };

  if (!isSupabaseConfigured) {
    if (!isLocalDev) {
      return (
        <div className="sg-shell antialiased">
          <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
            <div className="sg-panel-dark mx-auto mt-16 max-w-2xl p-6 text-center">
              <h2 className="sg-heading">Supabase 설정 필요</h2>
              <p className="sg-subtitle mt-3">
                `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 환경변수를 등록한 뒤 다시 배포해주세요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!localSignedIn) {
      return (
        <div className="sg-shell antialiased">
          <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
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

    return (
      <div className="sg-shell antialiased">
        <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <div className="sg-chip">
              로컬 모드 · {localProfile.companyName} · {localProfile.fullName}
            </div>
            <button
              type="button"
              onClick={() => setLocalSignedIn(false)}
              className="sg-btn sg-btn-secondary px-3 py-1.5 text-[10px] font-bold"
            >
              회원가입 화면으로
            </button>
          </div>

          <CastleDefense
            userDisplayName={localProfile.fullName}
            companyName={localProfile.companyName}
            initialRepresentativeVariant={localProfile.representativeVariant}
            onRepresentativeVariantPersist={handleRepresentativeVariantPersist}
          />
        </div>
      </div>
    );
  }

  if (authLoading || (session && profileLoading)) {
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

  if (!session) {
    return (
      <div className="sg-shell antialiased">
        <div className="relative z-10 mx-auto max-w-[1180px] px-3 md:px-6">
          <AuthScreen />
        </div>
      </div>
    );
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
          onRepresentativeVariantPersist={handleRepresentativeVariantPersist}
        />
      </div>
    </div>
  );
}
