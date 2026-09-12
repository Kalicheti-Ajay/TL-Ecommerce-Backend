const { parse } = require("csv-parse/sync");

const REQUIRED_IMPORT_COLUMNS = [
  "name",
  "description",
  "price",
  "category",
  "stock",
  "published",
];

const parseProductsCsv = (buffer) => {
  const csvText = buffer.toString("utf-8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return records;
};

const validateProductRows = (rows) => {
  const errors = [];
  const products = [];

  if (!rows || rows.length === 0) {
    return {
      valid: false,
      errors: [
        {
          row: 0,
          message: "CSV file contains no product records.",
        },
      ],
      products: [],
    };
  }

  const firstRow = rows[0];

  for (const column of REQUIRED_IMPORT_COLUMNS) {
    if (!Object.prototype.hasOwnProperty.call(firstRow, column)) {
      errors.push({
        row: 1,
        field: column,
        message: `Missing required CSV column: ${column}`,
      });
    }
  }


  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      products: [],
    };
  }

  rows.forEach((row, index) => {
    const csvRowNumber = index + 2;
    const rowErrors = [];

    const name = row.name?.trim();
    const description = row.description?.trim();
    const category = row.category?.trim();

    const price = Number(row.price);
    const stock = Number(row.stock);

    const publishedValue = row.published
      ?.trim()
      .toLowerCase();

    if (!name) {
      rowErrors.push("name is required");
    }

    // description
    if (!description) {
      rowErrors.push("description is required");
    }

    if (
      row.price === undefined ||
      row.price === "" ||
      Number.isNaN(price) ||
      price <= 0
    ) {
      rowErrors.push(
        "price must be a positive number"
      );
    }


    if (!category) {
      rowErrors.push("category is required");
    }

    if (
      row.stock === undefined ||
      row.stock === "" ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      rowErrors.push(
        "stock must be a non-negative number"
      );
    }


    if (
      publishedValue !== "true" &&
      publishedValue !== "false"
    ) {
      rowErrors.push(
        "published must be either true or false"
      );
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: csvRowNumber,
        errors: rowErrors,
      });

      return;
    }

    products.push({
      name,
      description,
      price,
      category,
      stock,
      published: publishedValue === "true",
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    products,
  };
};

const convertProductsToCsv = (products) => {
  const headers = [
    "name",
    "description",
    "price",
    "category",
    "stock",
    "published",
  ];

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const headerRow = headers.join(",");

  const dataRows = products.map((product) => {
    return headers
      .map((header) => {
        return escapeCsvValue(product[header]);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
};

module.exports = {
  parseProductsCsv,
  validateProductRows,
  convertProductsToCsv,
};