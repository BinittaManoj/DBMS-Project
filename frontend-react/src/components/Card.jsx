function Card({ title, subtitle, children, actions }) {
    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">{subtitle}</p>
                    <h3>{title}</h3>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

export default Card;
