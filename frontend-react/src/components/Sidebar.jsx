const navItems = [
    'Dashboard',
    'Inventory',
    'Sales',
    'Branches',
    'Suppliers',
    'Reports',
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="brand-wrap">
                <div className="brand-mark">M</div>
                <div>
                    <p className="eyebrow">Pharmacy Suite</p>
                    <h2>MedMart</h2>
                </div>
            </div>

            <nav className="nav-menu" aria-label="Sidebar navigation">
                {navItems.map((item, index) => (
                    <button key={item} className={index === 0 ? 'nav-item active' : 'nav-item'} type="button">
                        {item}
                    </button>
                ))}
            </nav>

            <div className="sidebar-card">
                <p>System status</p>
                <strong>Online</strong>
                <span>All stores synced</span>
            </div>
        </aside>
    );
}

export default Sidebar;
