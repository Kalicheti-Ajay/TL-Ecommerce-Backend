const mongoose = require("mongoose");
const Product = require("../models/products");
const { parseProductsCsv, validateProductRows, convertProductsToCsv } = require("../utils/csvUtils");

const fields = ["name", "description", "price", "category", "stock", "published"];
const clean = (body = {}) => Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
const validId = (id, res) => mongoose.isValidObjectId(id) || (res.status(400).json({ message: "Invalid product id." }), false);

async function createProduct(req, res, next) {
  try { return res.status(201).json({ message: "Product created.", product: await Product.create(clean(req.body)) }); }
  catch (error) { return next(error); }
}

async function getAllProducts(req, res, next) {
  try 
  {
    const { category, minPrice, maxPrice, sort = "newest" } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const filter = !req.user || req.user.role !== "admin" ? { published: true } : {};
    if (category) 
    {
      filter.category = new RegExp(`^${String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }
    if (minPrice !== undefined || maxPrice !== undefined) 
    {
      filter.price = {};
      if (minPrice !== undefined)
      {
         filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined)
      { 
        filter.price.$lte = Number(maxPrice);
      }
      if (Number.isNaN(filter.price.$gte) || Number.isNaN(filter.price.$lte))
      {
        return res.status(400).json({ message: "minPrice and maxPrice must be numbers." });
      }
    }
    const sorts = { price_asc: { price: 1 }, price_desc: { price: -1 }, newest: { createdAt: -1 } };
    if (!sorts[sort])
    {
      return res.status(400).json({ message: "sort must be price_asc, price_desc, or newest." });
    }
    const [products, totalProducts] = await Promise.all([Product.find(filter).sort(sorts[sort]).skip((page - 1) * limit).limit(limit), Product.countDocuments(filter)]);
    return res.json({ products, page, limit, totalProducts, totalPages: Math.ceil(totalProducts / limit) });
  } 
  catch(error) 
  { 
    return next(error); 
  }
}

async function getProductById(req, res, next) {
  try {
    if (!validId(req.params.id, res)) return;
    const product = await Product.findById(req.params.id);
    if (!product || (!product.published && (!req.user || req.user.role !== "admin")))
    {
       return res.status(404).json({ message: "Product not found." });
    }
    return res.json({ product });
  } catch (error)
  {
     return next(error); 
  }
}

async function updateProduct(req, res, next) 
{
  try {
    if (!validId(req.params.id, res)) return;
    const product = await Product.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true });
    if (!product)
    {
       return res.status(404).json({ message: "Product not found." });
    }
    return res.json({ message: "Product updated.", product });
  } 
  catch (error)
  {
     return next(error); 
  }
}

async function deleteProduct(req, res, next) {
  try {
    if (!validId(req.params.id, res)) return;
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
    {
       return res.status(404).json({ message: "Product not found." });
    }
    return res.json({ message: "Product deleted." });
  } 
  catch (error) 
  { 
    return next(error); 
  }
}

const changePublication = (published) => async (req, res, next) => {
  try {
    if (!validId(req.params.id, res)) return;
    const product = await Product.findByIdAndUpdate(req.params.id, { published }, { new: true, runValidators: true });
    if (!product)
    {
       return res.status(404).json({ message: "Product not found." });
    }
    return res.json({ message: `Product ${published ? "published" : "unpublished"}.`, product });
  } 
  catch (error) 
  { 
    return next(error); 
  }
};

async function importProducts(req, res, next) {
  try {
    if (!req.file) 
    {
      return res.status(400).json({ message: "Attach a CSV file in the file field." });
    }
    const validation = validateProductRows(parseProductsCsv(req.file.buffer));
    if (!validation.valid) 
    {
      return res.status(400).json({ message: "CSV validation failed. No products were imported.", errors: validation.errors });
    }
    const products = await Product.insertMany(validation.products, { ordered: true });
    return res.status(201).json({ message: "Products imported.", count: products.length, products });
  } 
  catch (error) 
  { 
    return next(error); 
  }
}

async function exportProducts(req, res, next) {
  try 
  {
    const products = await Product.find().select("name description price category stock published").sort({ createdAt: -1 }).lean();
    return res.attachment("products.csv").type("text/csv").send(convertProductsToCsv(products));
  } 
  catch (error) 
  { 
    return next(error); 
  }
}

async function deleteAllProducts(req, res, next) {
  try 
  {
    const result = await Product.deleteMany({});
    return res.json({ message: "All products deleted.", count: result.deletedCount });
  } 
  catch (error) 
  { 
    return next(error); 
  }
}

module.exports = { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  publishProduct: changePublication(true), 
  unpublishProduct: changePublication(false), 
  importProducts, 
  exportProducts ,
  deleteAllProducts
};
