// Antalya Gerçek Restoranlar Mock Data
export const antalyaRestaurants = [
  {
    _id: '1',
    name: 'Seraser Fine Dining Restaurant',
    category: 'Türk Mutfağı',
    rating: 4.8,
    distance: '1.2',
    image: '🍽️',
    imageUrl: 'https://images.unsplash.com/photo-1559329007-40df8ac8d90d?w=800&h=600&fit=crop',
    location: {
      lat: 36.8969,
      lng: 30.7133,
      address: 'Barbaros Mh., Hesapçı Sk. No:15, 07100 Muratpaşa/Antalya'
    },
    website: 'https://seraser.com',
    phone: '+90 242 247 6015',
    description: 'Antalya\'nın en prestijli restoranlarından biri olan Seraser, modern Türk mutfağının en seçkin örneklerini sunar.',
    adminNote: 'Günlük taze deniz ürünleri ve özel soslarla hazırlanan ana yemeklerimiz.',
    packages: [
      {
        _id: 'p1',
        name: 'Akşam Menüsü',
        description: 'Ana yemek, tatlı ve içecek dahil özel menü',
        quantity: 3,
        originalPrice: 450,
        salePrice: 280,
        discount: 38,
        status: 'available'
      }
    ]
  },
  {
    _id: '2',
    name: 'Vanilla Lounge',
    category: 'Kahve & Atıştırmalık',
    rating: 4.6,
    distance: '0.8',
    image: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
    location: {
      lat: 36.8889,
      lng: 30.7074,
      address: 'Kılınçarslan Mh., Hesapçı Sk. No:8, 07100 Muratpaşa/Antalya'
    },
    website: 'https://vanillalounge.com.tr',
    phone: '+90 242 241 6834',
    description: 'Kaleiçi\'nin kalbinde bulunan Vanilla Lounge, özel kahveleri ve ev yapımı tatlılarıyla meşhur.',
    adminNote: 'Günlük taze pasta ve özel blend kahvelerimiz.',
    packages: [
      {
        _id: 'p2',
        name: 'Kahve & Pasta Seti',
        description: 'Özel kahve + ev yapımı pasta',
        quantity: 5,
        originalPrice: 85,
        salePrice: 50,
        discount: 41,
        status: 'available'
      }
    ]
  },
  {
    _id: '3',
    name: 'Pasha Restaurant',
    category: 'Pizza & Fast Food',
    rating: 4.4,
    distance: '1.5',
    image: '🍕',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    location: {
      lat: 36.8856,
      lng: 30.7058,
      address: 'Kaleiçi, Mermerli Banyo Sk. No:25, 07100 Muratpaşa/Antalya'
    },
    website: 'https://pasharestaurant.com.tr',
    phone: '+90 242 248 5613',
    description: 'Kaleiçi\'nde tarihi atmosferde pizza ve Akdeniz mutfağı.',
    adminNote: 'Taş fırında pişirilen pizzalarımız ve günlük hazırlanan soslarımız.',
    packages: []
  },
  {
    _id: '4',
    name: 'Lara Balık Evi',
    category: 'Türk Mutfağı',
    rating: 4.7,
    distance: '3.2',
    image: '🐟',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
    location: {
      lat: 36.8335,
      lng: 30.7842,
      address: 'Lara, Güzeloba Mh., Yaşar Sobutay Blv. No:23, 07230 Muratpaşa/Antalya'
    },
    website: 'https://larabalikevi.com',
    phone: '+90 242 324 7890',
    description: 'Lara\'nın en eski balık restoranı, günlük taze deniz ürünleri.',
    adminNote: 'Sabah avlanan taze balıklarımız ve özel mezelerimiz.',
    packages: [
      {
        _id: 'p4',
        name: 'Balık Tabağı',
        description: 'Günlük balık + meze + salata',
        quantity: 2,
        originalPrice: 320,
        salePrice: 200,
        discount: 38,
        status: 'available'
      }
    ]
  },
  {
    _id: '5',
    name: 'Shakespeare Coffee & Bistro',
    category: 'Kahve & Atıştırmalık',
    rating: 4.5,
    distance: '0.6',
    image: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
    location: {
      lat: 36.8965,
      lng: 30.7126,
      address: 'Barbaros Mh., Atatürk Blv. No:145, 07100 Muratpaşa/Antalya'
    },
    website: 'https://shakespearecoffee.com',
    phone: '+90 242 238 9076',
    description: 'Kitap temalı kafe, özel kahveler ve ev yapımı kurabiyeler.',
    adminNote: 'Günlük taze kurabiyelerimiz ve özel roast kahvelerimiz.',
    packages: []
  },
  {
    _id: '6',
    name: 'Dem Antalya',
    category: 'Vegan & Sağlıklı',
    rating: 4.3,
    distance: '2.1',
    image: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    location: {
      lat: 36.9012,
      lng: 30.7198,
      address: 'Çankaya Mh., 1473. Sk. No:17, 07330 Muratpaşa/Antalya'
    },
    website: 'https://demantalya.com',
    phone: '+90 242 229 4567',
    description: 'Sağlıklı, organik ve vegan yemek seçenekleri.',
    adminNote: 'Organik sebzelerden hazırlanan özel salatalarımız.',
    packages: [
      {
        _id: 'p6',
        name: 'Sağlıklı Menü',
        description: 'Vegan ana yemek + salata + smoothie',
        quantity: 4,
        originalPrice: 150,
        salePrice: 95,
        discount: 37,
        status: 'available'
      }
    ]
  },
  {
    _id: '7',
    name: '7 Mehmet Restaurant',
    category: 'Türk Mutfağı',
    rating: 4.6,
    distance: '1.8',
    image: '🍽️',
    imageUrl: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop',
    location: {
      lat: 36.8794,
      lng: 30.6926,
      address: 'Konyaaltı, Atatürk Blv. No:204, 07050 Konyaaltı/Antalya'
    },
    website: 'https://7mehmet.com.tr',
    phone: '+90 242 238 5200',
    description: 'Antalya\'nın en köklü restoranlarından biri, geleneksel Türk mutfağı.',
    adminNote: 'Geleneksel tariflerle hazırlanan özel kebap çeşitlerimiz.',
    packages: [
      {
        _id: 'p7',
        name: 'Kebap Menüsü',
        description: 'Karışık kebap + pilav + salata',
        quantity: 1,
        originalPrice: 280,
        salePrice: 180,
        discount: 36,
        status: 'available'
      }
    ]
  },
  {
    _id: '8',
    name: 'Arma Restaurant',
    category: 'Pizza & Fast Food',
    rating: 4.2,
    distance: '1.0',
    image: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop',
    location: {
      lat: 36.8911,
      lng: 30.7089,
      address: 'Barbaros Mh., Konyaaltı Cd. No:30, 07100 Muratpaşa/Antalya'
    },
    website: 'https://armarestaurant.com',
    phone: '+90 242 244 9823',
    description: 'Modern fast food konsepti, burger ve pizza çeşitleri.',
    adminNote: 'Taze malzemelerle hazırlanan burger ve pizzalarımız.',
    packages: []
  },
  {
    _id: '9',
    name: 'Marina Restaurant',
    category: 'Türk Mutfağı',
    rating: 4.8,
    distance: '0.9',
    image: '🍽️',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    location: {
      lat: 36.8847,
      lng: 30.7053,
      address: 'Kaleiçi, Yat Limanı, 07100 Muratpaşa/Antalya'
    },
    website: 'https://marinaantalya.com',
    phone: '+90 242 248 3600',
    description: 'Marina manzaralı restoran, deniz ürünleri ve Akdeniz mutfağı.',
    adminNote: 'Marina manzarası eşliğinde taze deniz ürünlerimiz.',
    packages: [
      {
        _id: 'p9',
        name: 'Marina Menüsü',
        description: 'Deniz ürünleri + meze + içecek',
        quantity: 3,
        originalPrice: 380,
        salePrice: 240,
        discount: 37,
        status: 'available'
      }
    ]
  },
  {
    _id: '10',
    name: 'Konyaaltı Beach Cafe',
    category: 'Kahve & Atıştırmalık',
    rating: 4.1,
    distance: '2.5',
    image: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop',
    location: {
      lat: 36.8734,
      lng: 30.6789,
      address: 'Konyaaltı, Sahil Şeridi, 07050 Konyaaltı/Antalya'
    },
    website: 'https://konyaaltibeach.com',
    phone: '+90 242 259 1847',
    description: 'Konyaaltı sahili üzerinde deniz manzaralı kafe.',
    adminNote: 'Deniz kenarında taze sıkılmış meyve suları ve atıştırmalıklarımız.',
    packages: []
  },
  {
    _id: '11',
    name: 'Akdeniz Hatay Sofrası',
    category: 'Türk Mutfağı',
    rating: 4.4,
    distance: '1.7',
    image: '🌶️',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    location: {
      lat: 36.8923,
      lng: 30.7156,
      address: 'Çankaya Mh., 1461. Sk. No:8, 07330 Muratpaşa/Antalya'
    },
    website: 'https://hataysofrasi.com.tr',
    phone: '+90 242 227 3456',
    description: 'Geleneksel Hatay mutfağı, baharatlı lezzetler.',
    adminNote: 'Hatay\'dan getirilen özel baharatlarla hazırlanan yemeklerimiz.',
    packages: [
      {
        _id: 'p11',
        name: 'Hatay Karışık Tabağı',
        description: 'Künefe + hummus + lahmacun + şalgam',
        quantity: 2,
        originalPrice: 180,
        salePrice: 115,
        discount: 36,
        status: 'available'
      }
    ]
  },
  {
    _id: '12',
    name: 'Green Garden Cafe',
    category: 'Vegan & Sağlıklı',
    rating: 4.3,
    distance: '1.3',
    image: '🥬',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
    location: {
      lat: 36.8987,
      lng: 30.7187,
      address: 'Memurevleri Mh., 1487. Sk. No:12, 07010 Muratpaşa/Antalya'
    },
    website: 'https://greengarden.com.tr',
    phone: '+90 242 321 7689',
    description: 'Bahçe içinde organik ve vegan yemek seçenekleri.',
    adminNote: 'Kendi bahçemizde yetişen organik sebzelerden hazırlanan yemeklerimiz.',
    packages: []
  },
  {
    _id: '13',
    name: 'Pizza Corner',
    category: 'Pizza & Fast Food',
    rating: 4.0,
    distance: '0.7',
    image: '🍕',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
    location: {
      lat: 36.8945,
      lng: 30.7098,
      address: 'Barbaros Mh., Fevzi Çakmak Cd. No:67, 07100 Muratpaşa/Antalya'
    },
    website: 'https://pizzacorner.com.tr',
    phone: '+90 242 241 8394',
    description: 'Hızlı servis pizza ve fast food seçenekleri.',
    adminNote: 'İnce hamur pizzalarımız ve taze malzemelerimiz.',
    packages: []
  },
  {
    _id: '14',
    name: 'Terrace Restaurant & Bar',
    category: 'Türk Mutfağı',
    rating: 4.5,
    distance: '1.1',
    image: '🍷',
    imageUrl: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&h=600&fit=crop',
    location: {
      lat: 36.8876,
      lng: 30.7067,
      address: 'Kaleiçi, Hıdırlık Sk. No:4, 07100 Muratpaşa/Antalya'
    },
    website: 'https://terraceantalya.com',
    phone: '+90 242 247 2563',
    description: 'Teras üzerinde şehir manzaralı fine dining deneyimi.',
    adminNote: 'Şehir manzarası eşliğinde özel şarap seçkilerimiz ve modern Türk mutfağı.',
    packages: [
      {
        _id: 'p14',
        name: 'Teras Menüsü',
        description: 'Aperatif + ana yemek + tatlı + şarap',
        quantity: 2,
        originalPrice: 420,
        salePrice: 280,
        discount: 33,
        status: 'available'
      }
    ]
  },
  {
    _id: '15',
    name: 'Kahve Diyarı',
    category: 'Kahve & Atıştırmalık',
    rating: 4.2,
    distance: '1.9',
    image: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
    location: {
      lat: 36.8798,
      lng: 30.6943,
      address: 'Çakırlar Mh., 2255. Sk. No:15, 07050 Konyaaltı/Antalya'
    },
    website: 'https://kahvediyari.com.tr',
    phone: '+90 242 229 8765',
    description: 'Geleneksel Türk kahvesi ve modern espresso seçenekleri.',
    adminNote: 'Özel kavrulmuş kahve çekirdeklerimiz ve ev yapımı lokumlarımız.',
    packages: []
  }
];

export const categoryFilters = [
  { id: 'all', name: 'Tümü', emoji: '🍽️' },
  { id: 'coffee', name: 'Kahve', emoji: '☕' },
  { id: 'fastfood', name: 'Fast Food', emoji: '🍔' },
  { id: 'turkish', name: 'Türk Mutfağı', emoji: '🥘' },
  { id: 'vegan', name: 'Vegan', emoji: '🥗' },
];