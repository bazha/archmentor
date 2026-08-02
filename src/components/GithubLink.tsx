import { useT } from '@/i18n/useT';
import { Icon } from './Icon';

const REPO_URL = 'https://github.com/bazha/archmentor';

export function GithubLink() {
  const t = useT();
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={t('common.githubRepo')}
      className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Icon name="github" className="h-[1.05rem] w-[1.05rem]" />
      <span>archmentor</span>
    </a>
  );
}
