'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

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
            <Link href="/" className="navbar-brand">📚 eLibrary</Link>
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
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            {user.displayName ?? user.email}
                        </span>
                        <button className="btn btn-outline btn-sm" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }} onClick={handleSignOut}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
                            Sign In
                        </Link>
                        <Link href="/register" className="btn btn-white btn-sm">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
