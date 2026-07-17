import Link from 'next/link';

export function SiteFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div>
                    <div className="footer-brand">
                        <span className="brand-mark">📚</span>
                        Aklatan+
                    </div>
                    <p className="footer-note">
                        © {year} Aklatan+ · A digital collection for every reader.
                    </p>
                </div>
                <div className="footer-links">
                    <Link href="/catalog">Catalog</Link>
                    <Link href="/login">Sign In</Link>
                    <Link href="/register">Join</Link>
                </div>
            </div>
        </footer>
    );
}
