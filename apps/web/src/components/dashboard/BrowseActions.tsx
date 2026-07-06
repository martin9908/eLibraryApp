import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import Link from 'next/link';

export function BrowseActions() {
    return (
        <div className="dash-browse">
            <Link href="/catalog?type=ebook" className="dash-browse-tile ebooks">
                <span className="tile-title">📖 {S.browse.ebooksTitle}</span>
                <span className="tile-sub">{S.browse.ebooksSubtitle}</span>
            </Link>
            <Link href="/catalog?type=physical" className="dash-browse-tile physical">
                <span className="tile-title">📚 {S.browse.physicalTitle}</span>
                <span className="tile-sub">{S.browse.physicalSubtitle}</span>
            </Link>
        </div>
    );
}
