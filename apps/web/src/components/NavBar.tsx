'use client';

import { useAuth } from '@/src/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function NavBar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-brand">
                <span className="brand-mark">📚</span>
                <span className="brand-text">eLibrary</span>
            </Link>
            <div className="navbar-links">
                <Link href="/catalog" className={`nav-link${pathname.startsWith('/catalog') ? ' active' : ''}`}>
                    Catalog
                </Link>
                {user && (
                    <Link href="/account" className={`nav-link${pathname === '/account' ? ' active' : ''}`}>
                        Account
                    </Link>
                )}
            </div>
            <div className="navbar-auth">
                {user ? (
                    <>
                        <span className="navbar-user">
                            {user.displayName ?? user.email}
                        </span>
                        <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn btn-outline btn-sm">
                            Sign In
                        </Link>
                        <Link href="/register" className="btn btn-primary btn-sm">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
