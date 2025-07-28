import { useState, useEffect } from "react";
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
    tags: [], // ✅ tags array
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
    tags: [],
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Pagination state
  const productsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    "Groceries",
    "Utensils / Toys",
    "Clothes & Fashion",
    "Electronics",
    "Household",
  ];

  // Validation helper
  const validateProduct = (prod) => {
    const errors = {};
    if (!prod.name.trim()) errors.name = "Product name is required";
    if (prod.price === "" || isNaN(prod.price) || Number(prod.price) < 0)
      errors.price = "Price must be a positive number";
    if (!prod.category) errors.category = "Category is required";
    if (prod.stock !== "" && (isNaN(prod.stock) || Number(prod.stock) < 0))
      errors.stock = "Stock must be zero or more";
    if (
      prod.rating !== "" &&
      (isNaN(prod.rating) || Number(prod.rating) < 0 || Number(prod.rating) > 5)
    )
      errors.rating = "Rating must be between 0 and 5";
    if (
      prod.reviewCount !== "" &&
      (isNaN(prod.reviewCount) || Number(prod.reviewCount) < 0)
    )
      errors.reviewCount = "Review count must be zero or more";
    if (!prod.image.trim()) errors.image = "Image filename is required";

    return errors;
  };

  // Create Product submit handler with validation
  const handleCreate = async (e) => {
    e.preventDefault();

    const errors = validateProduct(product);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const productData = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        rating: parseFloat(product.rating),
        reviewCount: parseInt(product.reviewCount),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tags: product.tags,
      };

      const res = await authFetch("http://localhost:5000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error("Failed to create product");

      const newProduct = await res.json();
      setProducts([...products, newProduct]);

      // reset form & errors
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
        tags: [],
      });
      setValidationErrors({});
      setError(null);

      // If the new product falls on a new page, jump to last page
      const totalProducts = products.length + 1;
      const lastPage = Math.ceil(totalProducts / productsPerPage);
      setCurrentPage(lastPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers (same validation on save)
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
      tags: product.tags || [],
    });
    setValidationErrors({});
  };

  const handleSave = async () => {
    const errors = validateProduct(editedProduct);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
        tags: editedProduct.tags,
      };

      const res = await authFetch(
        `http://localhost:5000/products/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );

      if (!res.ok) throw new Error("Failed to update product");

      setProducts((prev) =>
        prev.map((product) =>
          product._id === editingId ? { ...product, ...productData } : product
        )
      );
      setEditingId(null);
      setValidationErrors({});
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((product) => product._id !== id));
      setError(null);

      // If deleting leaves current page empty, go back one page if possible
      const totalAfterDelete = products.length - 1;
      const lastPage = Math.ceil(totalAfterDelete / productsPerPage);
      if (currentPage > lastPage) setCurrentPage(lastPage);
    } catch (err) {
      setError(err.message);
    }
  };

  // Pagination calculations
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Create New Product</h2>
      <form
        onSubmit={handleCreate}
        className="bg-gray-800 p-6 shadow rounded mb-6"
        noValidate
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Product Name */}
          <div>
            <input
              type="text"
              required
              placeholder="Product Name"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.name && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="Price"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.price && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.price}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <select
              required
              value={product.category}
              onChange={(e) => setProduct({ ...product, category: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none w-full"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.category}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Stock"
              value={product.stock}
              onChange={(e) => setProduct({ ...product, stock: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.stock && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.stock}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="Rating (0-5)"
              value={product.rating}
              onChange={(e) => setProduct({ ...product, rating: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.rating && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.rating}</p>
            )}
          </div>

          {/* Review Count */}
          <div>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Review Count"
              value={product.reviewCount}
              onChange={(e) =>
                setProduct({ ...product, reviewCount: e.target.value })
              }
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.reviewCount && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.reviewCount}</p>
            )}
          </div>

          {/* Image filename */}
          <div>
            <input
              type="text"
              required
              placeholder="Image filename"
              value={product.image}
              onChange={(e) => setProduct({ ...product, image: e.target.value })}
              className="p-2 border rounded bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400 w-full"
            />
            {validationErrors.image && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.image}</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <textarea
              placeholder="Description"
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              rows="3"
              className="p-2 border rounded w-full bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2 rounded transition"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4 text-white">Product List</h2>

      <table className="w-full border-collapse bg-gray-900 text-gray-200 rounded shadow">
        <thead className="bg-gray-700 text-gray-100">
          <tr>
            <th className="p-3 border border-gray-600">Name</th>
            <th className="p-3 border border-gray-600">Price</th>
            <th className="p-3 border border-gray-600">Category</th>
            <th className="p-3 border border-gray-600">Stock</th>
            <th className="p-3 border border-gray-600">Rating</th>
            <th className="p-3 border border-gray-600">Review Count</th>
            <th className="p-3 border border-gray-600">Image Filename</th>
            <th className="p-3 border border-gray-600">Active</th>
            <th className="p-3 border border-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentProducts.length === 0 && (
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-400">
                No products found.
              </td>
            </tr>
          )}

          {currentProducts.map((prod) => (
            <tr key={prod._id} className="hover:bg-gray-700">
              {editingId === prod._id ? (
                <>
                  <td className="p-2 border border-gray-600">
                    <input
                      type="text"
                      value={editedProduct.name}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, name: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    />
                    {validationErrors.name && (
                      <p className="text-red-400 text-xs">{validationErrors.name}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editedProduct.price}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, price: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    />
                    {validationErrors.price && (
                      <p className="text-red-400 text-xs">{validationErrors.price}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    <select
                      value={editedProduct.category}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, category: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="text-red-400 text-xs">{validationErrors.category}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editedProduct.stock}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, stock: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    />
                    {validationErrors.stock && (
                      <p className="text-red-400 text-xs">{validationErrors.stock}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={editedProduct.rating}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, rating: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    />
                    {validationErrors.rating && (
                      <p className="text-red-400 text-xs">{validationErrors.rating}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editedProduct.reviewCount}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, reviewCount: e.target.value })
                      }
                      className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
                    />
                    {validationErrors.reviewCount && (
                      <p className="text-red-400 text-xs">{validationErrors.reviewCount}</p>
                    )}
                  </td>

                  <td className="p-2 border border-gray-600">
                    {/* Image filename is not editable in the list, but can be added here if needed */}
                    <em>{prod.image}</em>
                  </td>

                  <td className="p-2 border border-gray-600 text-center">
                    <input
                      type="checkbox"
                      checked={editedProduct.isActive}
                      onChange={(e) =>
                        setEditedProduct({ ...editedProduct, isActive: e.target.checked })
                      }
                    />
                  </td>

                  <td className="p-2 border border-gray-600 space-x-2">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setValidationErrors({});
                      }}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2 border border-gray-600">{prod.name}</td>
                  <td className="p-2 border border-gray-600">${prod.price.toFixed(2)}</td>
                  <td className="p-2 border border-gray-600">{prod.category}</td>
                  <td className="p-2 border border-gray-600">{prod.stock}</td>
                  <td className="p-2 border border-gray-600">{prod.rating}</td>
                  <td className="p-2 border border-gray-600">{prod.reviewCount}</td>
                  <td className="p-2 border border-gray-600">{prod.image}</td>
                  <td className="p-2 border border-gray-600 text-center">
                    {prod.isActive ? "✅" : "❌"}
                  </td>
                  <td className="p-2 border border-gray-600 space-x-2">
                    <button
                      onClick={() => handleEditClick(prod)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prod._id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
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

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-between items-center text-gray-300">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Showing {indexOfFirstProduct + 1}–{Math.min(indexOfLastProduct, products.length)} of{" "}
          {products.length} products
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductForm;
