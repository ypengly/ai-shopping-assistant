import json

categories = {
    "Electronics": ["Laptops", "Smartphones", "Headphones", "Chargers", "Keyboards"],
    "Clothing": ["T-Shirts", "Shirts", "Jeans", "Jackets", "Dresses"],
    "Shoes": ["Running Shoes", "Sneakers", "Formal Shoes"],
}

colors_clothing = ["Black", "White", "Navy", "Grey", "Olive", "Red"]
sizes_clothing = ["S", "M", "L", "XL"]
sizes_shoes = ["40", "41", "42", "43", "44"]

products = []


def add_product(name, top, sub, brand, price, original_price, stock, rating, review_count,
                 short_desc, description, specs, tags, variants, featured=False):
    products.append({
        "name": name, "top": top, "category": sub, "brand": brand, "price": price,
        "originalPrice": original_price, "stock": stock, "rating": rating,
        "reviewCount": review_count, "shortDescription": short_desc, "description": description,
        "specs": specs, "tags": tags, "variants": variants, "featured": featured,
    })


laptop_specs = [
    ("ASUS Vivobook 15", "ASUS", 649.0, None, 22, 4.6, 812,
     "16GB RAM, 512GB SSD, all-day battery for work and study.",
     "The Vivobook 15 pairs a Ryzen 5 processor with 16GB of RAM and a fast 512GB SSD, "
     "making it a comfortable everyday machine for browsing, office work, and light development. "
     "The 15.6-inch display and full-size keyboard make long sessions easier on the eyes and hands.",
     {"RAM": "16GB", "Storage": "512GB SSD", "Processor": "AMD Ryzen 5 7530U", "Display": "15.6\" FHD", "OS": "Windows 11", "Battery": "Up to 10 hours"},
     ["laptop", "windows", "office", "student"], False),
    ("ASUS ROG Strix G16", "ASUS", 1399.0, 1599.0, 8, 4.7, 340,
     "32GB RAM, RTX 4060, built for gaming and heavy multitasking.",
     "The ROG Strix G16 is built for gaming and demanding creative work, with a Core i7 processor, "
     "32GB of RAM, and an RTX 4060 graphics card. A 165Hz display keeps fast-moving games smooth.",
     {"RAM": "32GB", "Storage": "1TB SSD", "Processor": "Intel Core i7-13650HX", "GPU": "NVIDIA RTX 4060", "Display": "16\" QHD 165Hz", "OS": "Windows 11"},
     ["laptop", "gaming", "windows", "high-performance"], True),
    ("Lenovo ThinkPad E14", "Lenovo", 729.0, None, 15, 4.5, 501,
     "16GB RAM, 512GB SSD, durable business laptop with Windows 11.",
     "The ThinkPad E14 brings Lenovo's legendary keyboard and business-grade durability to a 14-inch "
     "laptop with 16GB of RAM and a 512GB SSD - comfortable for programming, spreadsheets, and video calls.",
     {"RAM": "16GB", "Storage": "512GB SSD", "Processor": "Intel Core i5-1335U", "Display": "14\" FHD", "OS": "Windows 11", "Battery": "Up to 12 hours"},
     ["laptop", "windows", "programming", "business"], False),
    ("Lenovo Legion 5", "Lenovo", 999.0, 1199.0, 10, 4.6, 275,
     "16GB RAM, RTX 4050, a well-rounded gaming and programming laptop.",
     "The Legion 5 balances gaming performance with everyday usability: 16GB of RAM, a Ryzen 7 "
     "processor, and an RTX 4050 GPU handle games, IDEs, and multitasking without slowing down.",
     {"RAM": "16GB", "Storage": "512GB SSD", "Processor": "AMD Ryzen 7 7735HS", "GPU": "NVIDIA RTX 4050", "Display": "15.6\" FHD 144Hz", "OS": "Windows 11"},
     ["laptop", "gaming", "programming", "windows"], False),
    ("Apple MacBook Air 13\" (M3)", "Apple", 1099.0, None, 18, 4.9, 1203,
     "8GB RAM, 256GB SSD, fanless design with all-day battery life.",
     "The M3 MacBook Air is silent, light, and fast enough for everyday work, browsing, and light "
     "photo editing, with a battery that comfortably lasts a full day away from a charger.",
     {"RAM": "8GB", "Storage": "256GB SSD", "Processor": "Apple M3", "Display": "13.6\" Liquid Retina", "OS": "macOS", "Battery": "Up to 18 hours"},
     ["laptop", "macos", "portable", "student"], True),
    ("Apple MacBook Pro 14\" (M3 Pro)", "Apple", 1999.0, None, 6, 4.9, 410,
     "18GB RAM, 512GB SSD, pro-level performance for development and creative work.",
     "The 14-inch MacBook Pro with M3 Pro handles demanding development, video editing, and design "
     "workloads with ease, backed by 18GB of unified memory and a bright mini-LED display.",
     {"RAM": "18GB", "Storage": "512GB SSD", "Processor": "Apple M3 Pro", "Display": "14.2\" Liquid Retina XDR", "OS": "macOS"},
     ["laptop", "macos", "programming", "professional"], False),
    ("Samsung Galaxy Book4", "Samsung", 799.0, None, 12, 4.4, 156,
     "16GB RAM, 512GB SSD, lightweight laptop with a bright AMOLED display.",
     "The Galaxy Book4 pairs a vivid AMOLED screen with 16GB of RAM and a 512GB SSD, in a slim "
     "chassis that's easy to carry between classes or meetings.",
     {"RAM": "16GB", "Storage": "512GB SSD", "Processor": "Intel Core i5-1340P", "Display": "15.6\" AMOLED", "OS": "Windows 11"},
     ["laptop", "windows", "portable", "student"], False),
]
for name, brand, price, orig, stock, rating, rc, short, desc, specs, tags, featured in laptop_specs:
    add_product(name, "Electronics", "Laptops", brand, price, orig, stock, rating, rc, short, desc, specs, tags, [], featured)

phone_specs = [
    ("Samsung Galaxy A55", "Samsung", 379.0, None, 30, 4.5, 620,
     "8GB RAM, 128GB storage, 50MP camera, all-day battery.",
     "The Galaxy A55 offers a smooth 120Hz display, a versatile 50MP camera system, and enough "
     "battery to comfortably last a full day of calls, browsing, and photos.",
     {"RAM": "8GB", "Storage": "128GB", "Battery": "5000mAh", "Camera": "50MP triple camera", "Display": "6.6\" AMOLED 120Hz"},
     ["phone", "android", "camera", "budget"], False),
    ("Samsung Galaxy S24", "Samsung", 799.0, 899.0, 14, 4.7, 940,
     "8GB RAM, 256GB storage, flagship camera and performance.",
     "The Galaxy S24 pairs a fast Snapdragon processor with a refined triple camera system, ideal "
     "for photography, gaming, and everyday multitasking.",
     {"RAM": "8GB", "Storage": "256GB", "Battery": "4000mAh", "Camera": "50MP triple camera", "Display": "6.2\" AMOLED 120Hz"},
     ["phone", "android", "flagship", "camera"], True),
    ("Apple iPhone 15", "Apple", 799.0, None, 20, 4.8, 1500,
     "128GB storage, A16 chip, durable and fast for everyday use.",
     "The iPhone 15 brings the A16 chip, a 48MP main camera, and Apple's long software support to "
     "a comfortable, everyday-sized phone.",
     {"Storage": "128GB", "Chip": "A16 Bionic", "Camera": "48MP dual camera", "Display": "6.1\" Super Retina XDR"},
     ["phone", "ios", "camera", "flagship"], False),
    ("Apple iPhone 15 Pro", "Apple", 999.0, None, 9, 4.9, 680,
     "256GB storage, titanium build, pro camera system for gaming and photography.",
     "The iPhone 15 Pro's A17 Pro chip makes it one of the strongest phones available for gaming and "
     "video, paired with a titanium frame and a more capable telephoto camera.",
     {"Storage": "256GB", "Chip": "A17 Pro", "Camera": "48MP triple camera", "Display": "6.1\" Super Retina XDR ProMotion"},
     ["phone", "ios", "gaming", "camera", "flagship"], True),
    ("ASUS ROG Phone 8", "ASUS", 899.0, None, 5, 4.6, 120,
     "16GB RAM, 256GB storage, built specifically for mobile gaming.",
     "The ROG Phone 8 is tuned for gaming: a 165Hz display, dedicated shoulder triggers, and a "
     "large battery keep long sessions smooth without overheating.",
     {"RAM": "16GB", "Storage": "256GB", "Battery": "5500mAh", "Display": "6.78\" AMOLED 165Hz"},
     ["phone", "android", "gaming", "high-performance"], False),
]
for name, brand, price, orig, stock, rating, rc, short, desc, specs, tags, featured in phone_specs:
    add_product(name, "Electronics", "Smartphones", brand, price, orig, stock, rating, rc, short, desc, specs, tags, [], featured)

headphone_specs = [
    ("Sony WH-1000XM5", "Sony", 349.0, 399.0, 25, 4.9, 2100,
     "Industry-leading noise cancellation, 30-hour battery life.",
     "The WH-1000XM5 combines Sony's best noise cancellation with a comfortable over-ear fit and "
     "30 hours of battery life, making them a reliable choice for travel, calls, and focused work.",
     {"Battery life": "30 hours", "Connectivity": "Bluetooth 5.2", "Noise cancellation": "Yes", "Type": "Over-ear"},
     ["headphones", "wireless", "noise cancelling", "travel"], True),
    ("JBL Tune 760NC", "JBL", 79.0, 99.0, 40, 4.4, 860,
     "Active noise cancelling with 50-hour battery life at a budget price.",
     "The Tune 760NC delivers active noise cancellation and punchy bass at a budget-friendly price, "
     "with up to 50 hours of playback on a single charge.",
     {"Battery life": "50 hours", "Connectivity": "Bluetooth 5.3", "Noise cancellation": "Yes", "Type": "Over-ear"},
     ["headphones", "wireless", "noise cancelling", "budget"], False),
    ("Apple AirPods Pro (2nd gen)", "Apple", 219.0, 249.0, 33, 4.8, 3040,
     "Active noise cancellation in a compact true-wireless earbud.",
     "AirPods Pro pair adaptive noise cancellation with a compact, secure fit, plus easy pairing "
     "across Apple devices and a case that supports wireless charging.",
     {"Battery life": "6 hours (30 with case)", "Connectivity": "Bluetooth 5.3", "Noise cancellation": "Yes", "Type": "In-ear"},
     ["headphones", "wireless", "earbuds", "noise cancelling"], True),
    ("Logitech G Pro X", "Logitech", 129.0, None, 18, 4.6, 430,
     "Gaming headset with detachable microphone and 7.1 surround sound.",
     "Built for competitive gaming, the G Pro X offers clear positional audio and a detachable "
     "microphone tuned for voice clarity in fast-paced matches.",
     {"Connectivity": "Wired / USB", "Surround sound": "DTS Headphone:X 2.0", "Type": "Over-ear", "Microphone": "Detachable"},
     ["headphones", "gaming", "microphone", "wired"], False),
]
for name, brand, price, orig, stock, rating, rc, short, desc, specs, tags, featured in headphone_specs:
    add_product(name, "Electronics", "Headphones", brand, price, orig, stock, rating, rc, short, desc, specs, tags, [], featured)

charger_specs = [
    ("Anker 735 Charger (65W)", "Anker", 39.0, 49.0, 60, 4.7, 1900,
     "Compact 65W GaN charger, fast-charges laptops and phones alike.",
     "This compact GaN charger delivers up to 65W, fast enough for most laptops, and small enough "
     "to carry everywhere. Two USB-C ports and one USB-A port cover most setups.",
     {"Output": "65W", "Ports": "2x USB-C, 1x USB-A", "Technology": "GaN"},
     ["charger", "fast charging", "travel", "budget"], False),
    ("Anker PowerCore 20000", "Anker", 45.0, None, 55, 4.6, 2600,
     "20,000mAh power bank with fast charging for phones and tablets.",
     "The PowerCore 20000 holds enough charge for multiple full phone charges, with fast-charging "
     "support so top-ups take less time on the go.",
     {"Capacity": "20000mAh", "Output": "18W PD", "Ports": "1x USB-C, 2x USB-A"},
     ["charger", "power bank", "travel"], False),
    ("Apple 20W USB-C Power Adapter", "Apple", 19.0, None, 80, 4.5, 3100,
     "Compact 20W charger, ideal for fast-charging iPhone and AirPods.",
     "A simple, reliable 20W USB-C adapter that fast-charges compatible iPhones to 50% in about "
     "30 minutes.",
     {"Output": "20W", "Ports": "1x USB-C", "Technology": "USB-C PD"},
     ["charger", "fast charging", "budget"], False),
]
for name, brand, price, orig, stock, rating, rc, short, desc, specs, tags, featured in charger_specs:
    add_product(name, "Electronics", "Chargers", brand, price, orig, stock, rating, rc, short, desc, specs, tags, [], featured)

keyboard_specs = [
    ("Logitech MX Keys", "Logitech", 99.0, 119.0, 28, 4.8, 1450,
     "Wireless keyboard with backlit keys, pairs with up to 3 devices.",
     "The MX Keys offers a quiet, well-spaced typing feel with backlit keys that adjust to ambient "
     "light, and can switch between three paired devices at the press of a button.",
     {"Connectivity": "Bluetooth / USB receiver", "Backlight": "Yes", "Battery life": "Up to 10 days (backlit)"},
     ["keyboard", "wireless", "office", "productivity"], True),
    ("ASUS ROG Strix Scope", "ASUS", 109.0, None, 16, 4.6, 380,
     "Mechanical gaming keyboard with red switches and per-key RGB.",
     "Linear red switches and per-key RGB lighting make the Strix Scope a responsive, customizable "
     "keyboard for competitive gaming.",
     {"Switch type": "Mechanical (red)", "Backlight": "Per-key RGB", "Connectivity": "Wired USB"},
     ["keyboard", "gaming", "mechanical", "rgb"], False),
    ("Logitech K380", "Logitech", 39.0, None, 45, 4.5, 2200,
     "Compact wireless keyboard that pairs with up to 3 devices.",
     "A compact, budget-friendly wireless keyboard that's easy to carry and switches between three "
     "paired devices, ideal for a simple multi-device desk setup.",
     {"Connectivity": "Bluetooth", "Backlight": "No", "Battery life": "Up to 2 years (AAA)"},
     ["keyboard", "wireless", "budget", "compact"], False),
]
for name, brand, price, orig, stock, rating, rc, short, desc, specs, tags, featured in keyboard_specs:
    add_product(name, "Electronics", "Keyboards", brand, price, orig, stock, rating, rc, short, desc, specs, tags, [], featured)

clothing_specs = [
    ("Classic Cotton T-Shirt", "Uniqlo", 14.99, None, 200, 4.4, 900, "T-Shirts",
     "Soft, breathable cotton tee for everyday wear.",
     "A wardrobe staple: 100% cotton, pre-shrunk, and cut for a relaxed, everyday fit that layers well.",
     {"Material": "100% cotton", "Fit": "Regular", "Care": "Machine washable"},
     ["t-shirt", "casual", "everyday", "cotton"], False),
    ("Black Formal Shirt", "Zara", 19.99, 24.99, 90, 4.8, 410, "Shirts",
     "Slim-fit formal shirt, great for weddings and office wear.",
     "A crisp slim-fit shirt in easy-care cotton blend, tailored for a sharp look at weddings, "
     "interviews, or the office.",
     {"Material": "Cotton blend", "Fit": "Slim", "Occasion": "Formal"},
     ["shirt", "formal", "wedding", "office"], True),
    ("Oxford Button-Down Shirt", "H&M", 29.99, None, 70, 4.5, 260, "Shirts",
     "Classic oxford shirt that moves from desk to dinner.",
     "A versatile oxford-weave shirt with a classic collar, comfortable for both office days and "
     "casual weekends.",
     {"Material": "Cotton", "Fit": "Regular", "Occasion": "Smart casual"},
     ["shirt", "office", "casual"], False),
    ("Slim Fit Jeans", "Levi's", 59.99, 69.99, 110, 4.6, 1800, "Jeans",
     "511 slim-fit jeans in stretch denim for everyday comfort.",
     "Levi's 511 slim fit sits close through the seat and thigh with a straighter leg, made from a "
     "stretch denim blend that keeps its shape through the day.",
     {"Material": "Stretch denim", "Fit": "Slim", "Rise": "Mid"},
     ["jeans", "denim", "casual", "everyday"], True),
    ("Relaxed Fit Jeans", "Levi's", 64.99, None, 65, 4.5, 540, "Jeans",
     "551Z relaxed-fit jeans with room through the seat and thigh.",
     "A roomier cut through the seat and thigh for all-day comfort, in durable classic denim.",
     {"Material": "100% cotton denim", "Fit": "Relaxed", "Rise": "Mid"},
     ["jeans", "denim", "casual"], False),
    ("Lightweight Puffer Jacket", "Zara", 49.99, 59.99, 55, 4.6, 320, "Jackets",
     "Packable puffer jacket for transitional weather.",
     "A lightweight, packable puffer that layers easily and folds into its own pocket, good for "
     "commutes and travel in cool weather.",
     {"Material": "Recycled polyester shell", "Insulation": "Synthetic down", "Water resistant": "Yes"},
     ["jacket", "outerwear", "travel", "lightweight"], False),
    ("Denim Jacket", "Levi's", 79.99, None, 40, 4.7, 610, "Jackets",
     "Classic trucker jacket in rigid denim.",
     "The Levi's Trucker Jacket is a timeless layering piece in sturdy denim that only gets better "
     "with wear.",
     {"Material": "100% cotton denim", "Fit": "Regular"},
     ["jacket", "denim", "casual", "classic"], False),
    ("Wrap Midi Dress", "Zara", 45.99, None, 38, 4.5, 190, "Dresses",
     "Flowy wrap dress suitable for both work and evenings out.",
     "A flattering wrap silhouette in a flowing fabric that transitions easily from the office to "
     "dinner plans.",
     {"Material": "Viscose blend", "Fit": "Wrap", "Occasion": "Smart casual"},
     ["dress", "occasion", "smart casual"], False),
    ("Floral Summer Dress", "H&M", 34.99, 39.99, 48, 4.4, 260, "Dresses",
     "Lightweight floral dress for warm-weather occasions.",
     "A breathable, lightweight dress with a floral print, comfortable for warm days and casual "
     "summer events.",
     {"Material": "100% viscose", "Fit": "Regular", "Occasion": "Casual"},
     ["dress", "summer", "casual", "floral"], False),
]
for name, brand, price, orig, stock, rating, rc, sub, short, desc, specs, tags, featured in clothing_specs:
    variants = [{"color": c, "size": s, "stock": max(0, stock // (3 * len(sizes_clothing)))}
                for c in colors_clothing[:3] for s in sizes_clothing]
    add_product(name, "Clothing", sub, brand, price, orig, stock, rating, rc, short, desc, specs, tags, variants, featured)

shoe_specs = [
    ("Nike Air Zoom Pegasus 40", "Nike", 89.99, 109.99, 70, 4.7, 1650, "Running Shoes",
     "Responsive cushioning for daily training runs.",
     "The Pegasus 40 is a dependable daily trainer with responsive foam cushioning, suited to easy "
     "runs and tempo work alike.",
     {"Material": "Engineered mesh", "Cushioning": "React foam", "Use": "Road running"},
     ["running shoes", "sneakers", "sport", "cushioned"], True),
    ("Adidas Ultraboost Light", "Adidas", 129.99, 189.99, 42, 4.8, 980, "Running Shoes",
     "Lightweight Boost midsole for energy return on long runs.",
     "A lighter version of the classic Ultraboost, with a responsive Boost midsole that returns "
     "energy on longer runs while staying comfortable for all-day wear.",
     {"Material": "Primeknit upper", "Cushioning": "Boost Light", "Use": "Road running"},
     ["running shoes", "sport", "cushioned"], False),
    ("New Balance Fresh Foam 1080", "New Balance", 149.99, None, 30, 4.7, 520, "Running Shoes",
     "Plush cushioning designed for long-distance comfort.",
     "The 1080 offers plush, protective cushioning that makes it a favorite for longer distances "
     "and recovery runs.",
     {"Material": "Engineered knit", "Cushioning": "Fresh Foam X", "Use": "Road running"},
     ["running shoes", "sport", "cushioned", "long distance"], False),
    ("Nike Air Force 1", "Nike", 99.99, None, 85, 4.9, 3400, "Sneakers",
     "Iconic leather sneaker for everyday, casual wear.",
     "The Air Force 1's leather upper and classic silhouette make it an everyday sneaker that "
     "pairs with almost anything.",
     {"Material": "Leather", "Sole": "Rubber", "Use": "Casual"},
     ["sneakers", "casual", "streetwear", "classic"], True),
    ("Adidas Samba OG", "Adidas", 109.99, None, 60, 4.8, 1250, "Sneakers",
     "Retro-styled leather sneaker with suede overlays.",
     "A retro-inspired low-top with a leather upper and suede overlays, popular as an everyday "
     "casual sneaker.",
     {"Material": "Leather with suede overlays", "Sole": "Gum rubber", "Use": "Casual"},
     ["sneakers", "casual", "streetwear"], False),
    ("Puma Suede Classic", "Puma", 74.99, 84.99, 50, 4.5, 640, "Sneakers",
     "Classic suede sneaker with a low-profile silhouette.",
     "A long-running classic: soft suede upper, low-profile silhouette, and a comfortable "
     "everyday fit.",
     {"Material": "Suede", "Sole": "Rubber", "Use": "Casual"},
     ["sneakers", "casual", "classic"], False),
    ("Clarks Desert Boot", "Clarks", 129.99, None, 25, 4.6, 410, "Formal Shoes",
     "Classic suede desert boot, smart-casual all year round.",
     "The original Desert Boot pairs soft suede with a crepe sole, sitting comfortably between "
     "casual and smart-casual wear.",
     {"Material": "Suede", "Sole": "Crepe", "Use": "Smart casual"},
     ["boots", "smart casual", "classic"], False),
    ("Clarks Tilden Cap Oxford", "Clarks", 139.99, 159.99, 20, 4.5, 210, "Formal Shoes",
     "Leather oxford shoe suited for weddings and the office.",
     "A polished leather oxford with a cap toe, well suited to weddings, interviews, or everyday "
     "office wear.",
     {"Material": "Leather", "Sole": "Leather with rubber pad", "Use": "Formal"},
     ["formal shoes", "leather", "wedding", "office"], False),
]
for name, brand, price, orig, stock, rating, rc, sub, short, desc, specs, tags, featured in shoe_specs:
    variants = [{"color": c, "size": s, "stock": max(0, stock // (2 * len(sizes_shoes)))}
                for c in ["Black", "White"] for s in sizes_shoes]
    add_product(name, "Shoes", sub, brand, price, orig, stock, rating, rc, short, desc, specs, tags, variants, featured)

with open("prisma/seed-data.json", "w") as f:
    json.dump({"categories": categories, "products": products}, f, indent=2)

print("products:", len(products))
