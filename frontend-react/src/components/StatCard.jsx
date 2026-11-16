function StatCard({ label, value, change, tone }) {
    return (
        <article className="stat-card">
            <div className="stat-header">
                <span>{label}</span>
                <span className={`trend ${tone}`}>{change}</span>
            </div>
            <h3>{value}</h3>
        </article>
    );
}

export default StatCard;
