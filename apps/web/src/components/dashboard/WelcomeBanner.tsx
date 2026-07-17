import { dashboardStrings as S } from '@/src/lib/dashboardStrings';

export function WelcomeBanner({ displayName, memberType }: { displayName: string; memberType: string }) {
    return (
        <section className="dash-welcome" aria-label="Welcome">
            <h1>{S.welcome.greeting(displayName)}</h1>
            <p>{S.welcome.subtitle}</p>
            <span className="dash-membertype">{memberType}</span>
        </section>
    );
}
