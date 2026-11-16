function InventoryTable({ rows }) {
    return (
        <section className="panel table-panel">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Live overview</p>
                    <h3>Inventory status</h3>
                </div>
                <button type="button">View all</button>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Branch</th>
                            <th>Stock</th>
                            <th>Reorder</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={`${row.product}-${row.branch}`}>
                                <td>{row.product}</td>
                                <td>{row.branch}</td>
                                <td>{row.stock}</td>
                                <td>{row.reorder}</td>
                                <td>
                                    <span className={`status-pill ${row.status.toLowerCase().replace(' ', '-')}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default InventoryTable;
