const express = require("express");
const Product = require("../models/products");

async function createProduct(req, res) {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: "You do not have permission to create a product"
            });
        }

        const {
            name,
            description,
            price,
            category,
            stock,
            published
        } = req.body;

        const product = await Product.create({
            name,
            description,
            price,
            category,
            stock,
            published
        });

        res.status(201).json(product);

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
}

async function getAllProducts(req, res) {
    try {

        const { category, minPrice, maxPrice, search, tags } = req.query;
        const filters = {};

        if (category) filters.category = category;
        if (req.user.role !== "admin") {
            filters.published = true;
        }

        // Range filters (Price)
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.$gte = Number(minPrice);
            if (maxPrice) filters.price.$lte = Number(maxPrice);
        }

        // Partial Text Search (Regex)
        if (search) {
            filters.name = { $regex: search, $options: 'i' };
        }

        // Array Filtering (e.g., tags=['electronics', 'smart'])
        if (tags) {
            filters.tags = { $in: Array.isArray(tags) ? tags : [tags] };
        }

        let sortStr = 'createdAt'; // Default sorting
        const allowedSortFields = ['price', 'createdAt'];

        if (req.query.sort) {
            const [field, order] = req.query.sort.split(',');
            if (allowedSortFields.includes(field)) {
                sortStr = order === 'desc' ? `-${field}` : field;
            }
        }

        // let limit = 10; // Default limit
        // if (req.query.limit) {
        //     limit = Math.min(Number(req.query.limit), 100); // Max limit of 100
        // }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        let limit = parseInt(req.query.limit, 10) || 10;

        // Hard cap the limit to protect database performance
        const MAX_LIMIT = 100;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        const skip = (page - 1) * limit;


        const products = await Product.find(filters).sort(sortStr).limit(limit).skip(skip);
        res.status(200).json(products);

        if (products.length === 0) {
            return res.status(404).json({
                error: "No products found"
            });
        }
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}

async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }
        if (product.published === false && req.user.role !== "admin") {
            return res.status(403).json({
                error: "You do not have permission to view this product"
            });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}

async function updateProduct(req, res) {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: "You do not have permission to update this product"
            });
        }

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}

async function patchProduct(req, res) {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: "You do not have permission to update this product"
            });
        }

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}


async function deleteProduct(req, res) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({
                error: "You do not have permission to delete this product"
            });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    patchProduct,
    deleteProduct
};