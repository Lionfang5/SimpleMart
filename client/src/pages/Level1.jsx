import { useState } from 'react';
import ProductList from "../components/ProductList";

const Level1 = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-4">
      <input
        type="text"
        placeholder="Search Groceries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-6 border rounded"
      />

      <ProductList category="Groceries" search={search} />
    </div>
  );
}

export default Level1;
