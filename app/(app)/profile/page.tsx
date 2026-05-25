'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('profile.title')}</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-6">
          {t('profile.businessInfo')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('auth.businessName')}
            </label>
            <Input
              value={(user?.user_metadata as Record<string, unknown> | undefined)?.businessName as string ?? ''}
              readOnly
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('auth.email')}
            </label>
            <Input
              value={user?.email || ''}
              readOnly
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('auth.phone')}
            </label>
            <Input
              value={user?.phone || ''}
              readOnly
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-6">
          {t('profile.changePassword')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('profile.currentPassword')}
            </label>
            <Input
              type="password"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('profile.newPassword')}
            </label>
            <Input
              type="password"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('profile.confirmNewPassword')}
            </label>
            <Input
              type="password"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
            {t('profile.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
