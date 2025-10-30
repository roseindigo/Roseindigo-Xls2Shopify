# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Roseindigo-Xls2Shopify is a client-side web application that converts Excel/TSV data into Shopify-formatted CSV files. It's designed for batch product imports with seasonal discount logic and image URL generation.

## Architecture

This is a simple static web application with no build process, consisting of:

- `index.html` - Main UI with form inputs for product data conversion
- `script.js` - Core logic for data transformation and CSV generation
- `styles.css` - Responsive styling with table preview functionality

The application runs entirely in the browser with no backend dependencies.

## Key Functionality

### Data Processing Flow (script.js)

1. **Input Processing**: Parses tab-separated values (TSV) from Excel paste
2. **Discount Logic**: Applies percentage discounts to products matching a selected season
3. **Image URL Generation**: Constructs full Shopify CDN URLs from base URL + filename
4. **Multi-Image Handling**: Creates multiple rows for products with multiple images (semicolon-separated)
5. **Price Formatting**: Ensures all prices use two decimal places with dot separator
6. **CSV Export**: Generates UTF-8 BOM-prefixed CSV with proper escaping

### Critical Business Logic

**Seasonal Discount Application** (script.js:86-102):
- Only applies discount when row's season matches selected season (Été/Hiver)
- Recalculates `Variant Price` while preserving `Variant Compare At Price`
- Non-matching seasons keep original prices

**Price Formatting** (script.js:53-78):
- Handles both string and numeric inputs
- Converts comma decimals to dot decimals
- Always returns two decimal places
- Validates and handles null/undefined/empty values

**Image Processing** (script.js:117-140):
- First image gets full product row data
- Subsequent images create minimal rows with only Handle, Image Src, and Image Position
- Normalizes file extensions to lowercase
- Constructs full Shopify CDN URLs

## Version Management

The script version is defined in two places and must be kept in sync:
- `index.html:16` - HTML display
- `script.js:201` - JavaScript version variable

Current version: 1.1.1

## Testing the Application

Since this is a static site with no build process:

1. Open `index.html` directly in a browser (File > Open)
2. Or use a simple HTTP server: `python3 -m http.server 8000`
3. Test with sample TSV data pasted into the text area

## Required Input Columns

The application expects TSV data with these headers:
- `Handle` (required)
- `Image Src` (required) - semicolon-separated for multiple images
- `Saison (product.metafields.custom.saison)` (required)
- `Variant Price` (modified by discount logic)
- `Variant Compare At Price` (preserved)
- `Cost per item` (preserved)
- `Image Position` (auto-generated)

## File Naming Convention

Generated CSV files follow this pattern:
`YYYY-MM-DD-HH_MM_SS-{sanitized-reference}.csv`

Example: `2025-10-30-14_30_45-sac-123.csv`