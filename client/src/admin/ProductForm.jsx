import { useState } from "react";
import { authFetch } from "../utils/authFetch";

const ProductForm = ({ products, setProducts, setError }) => {
  const [product, setProduct] = useState({ 
    name: "", 
    price: "", 
    category: "", 
    description: "",
    stock: "",
    rating: "",
    reviewCount: "",
    isActive: true,
    image: "",
    tags: [] // ✅ added new field
  });

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [editedProduct, setEditedProduct] = useState({ 
    name: "", 
    price: "", 
    category: "", 
    description: "",
    stock: "",
    rating: "",
    reviewCount: "",
    isActive: true,
    tags: [] // ✅ added new field
  });

  const categories = [
    "Groceries",
    "Utensils / Toys", 
    "Clothes & Fashion",
    "Electronics",
    "Household"
  ];

  // ✅ CREATE NEW PRODUCT
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        rating: parseFloat(product.rating),
        reviewCount: parseInt(product.reviewCount),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tags: product.tags // ✅ include tags here
      };

      const res = await authFetch("http://localhost:5000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error("Failed to create product");

      const newProduct = await res.json();
      setProducts([...products, newProduct]);

      // reset form
      setProduct({ 
        name: "", 
        price: "", 
        category: "", 
        description: "",
        stock: "",
        rating: "",
        reviewCount: "",
        isActive: true,
        image: "",
        tags: [] // ✅ reset tags after submit
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDIT MODE
  const handleEditClick = (product) => {
    setEditingId(product._id);
    setEditedProduct({ 
      name: product.name, 
      price: product.price.toString(),
      category: product.category || "",
      description: product.description || "",
      stock: product.stock.toString(),
      rating: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
      isActive: product.isActive,
      tags: product.tags || [] // ✅ pre-fill tags
    });
  };

  // ✅ SAVE EDITED PRODUCT
  const handleSave = async () => {
    try {
      const productData = {
        name: editedProduct.name,
        price: parseFloat(editedProduct.price),
        category: editedProduct.category,
        description: editedProduct.description,
        stock: parseInt(editedProduct.stock),
        rating: parseFloat(editedProduct.rating),
        reviewCount: parseInt(editedProduct.reviewCount),
        isActive: editedProduct.isActive,
        tags: editedProduct.tags // ✅ include tags here
      };

      const res = await authFetch(`http://localhost:5000/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error("Failed to update product");

      setProducts((prev) =>
        prev.map((product) =>
          product._id === editingId
            ? { ...product, ...productData }
            : product
        )
      );
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ DELETE PRODUCT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((product) => product._id !== id));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleCreate} className="bg-gray-800 p-4 shadow rounded mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Product Name */}
        <input
          type="text"
          required
          placeholder="Product Name"
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />

        {/* Price */}
        <input
          type="number"
          required
          placeholder="Price"
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />

        {/* Category */}
        <select
          required
          value={product.category}
          onChange={(e) => setProduct({ ...product, category: e.target.value })}
          className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Stock */}
        <input
          type="number"
          placeholder="Stock"
          value={product.stock}
          onChange={(e) => setProduct({ ...product, stock: e.target.value })}
          className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />

        {/* Image */}
        <input
          type="text"
          required
          placeholder="Image filename (e.g. apple.jpg)"
          value={product.image}
          onChange={e => setProduct({ ...product, image: e.target.value })}
          className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />
      </div>

      {/* ✅ TAGS INPUT */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={product.tags.join(", ")}
          onChange={(e) =>
            setProduct({
              ...product,
              tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
            })
          }
          className="w-full p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
        />
      </div>

      {/* ✅ CREATE BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? "Creating..." : "Add Product"}
      </button>

      {/* ✅ PRODUCT LIST TABLE */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-700 text-gray-200">
              <th className="border border-gray-600 p-2">Name</th>
              <th className="border border-gray-600 p-2">Price</th>
              <th className="border border-gray-600 p-2">Category</th>
              <th className="border border-gray-600 p-2">Stock</th>
              <th className="border border-gray-600 p-2">Tags</th>
              <th className="border border-gray-600 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="text-gray-300">
                {editingId === p._id ? (
                  <>
                    {/* Editable fields */}
                    <td className="border border-gray-600 p-2">
                      <input
                        type="text"
                        value={editedProduct.name}
                        onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                        className="w-full p-1 border rounded bg-gray-600 text-gray-200 border-gray-500"
                      />
                    </td>
                    <td className="border border-gray-600 p-2">
                      <input
                        type="number"
                        value={editedProduct.price}
                        onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
                        className="w-full p-1 border rounded bg-gray-600 text-gray-200 border-gray-500"
                      />
                    </td>
                    <td className="border border-gray-600 p-2">
                      <select
                        value={editedProduct.category}
                        onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                        className="w-full p-1 border rounded bg-gray-600 text-gray-200 border-gray-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-600 p-2">
                      <input
                        type="number"
                        value={editedProduct.stock}
                        onChange={(e) => setEditedProduct({ ...editedProduct, stock: e.target.value })}
                        className="w-full p-1 border rounded bg-gray-600 text-gray-200 border-gray-500"
                      />
                    </td>

                    {/* ✅ EDIT TAGS */}
                    <td className="border border-gray-600 p-2">
                      <input
                        type="text"
                        value={editedProduct.tags.join(", ")}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                          })
                        }
                        className="w-full p-1 border rounded bg-gray-600 text-gray-200 border-gray-500 text-sm"
                      />
                    </td>

                    {/* Save/Cancel */}
                    <td className="border border-gray-600 p-2">
                      <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* Non-editable view */}
                    <td className="border border-gray-600 p-2">{p.name}</td>
                    <td className="border border-gray-600 p-2">${p.price}</td>
                    <td className="border border-gray-600 p-2">{p.category}</td>
                    <td className="border border-gray-600 p-2">{p.stock}</td>
                    <td className="border border-gray-600 p-2">
                      {p.tags?.length ? p.tags.join(", ") : "—"}
                    </td>
                    <td className="border border-gray-600 p-2">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
};

export default ProductForm;
