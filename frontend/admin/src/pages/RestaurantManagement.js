// KapTaze Restoran Yönetim Paneli - Tam Türkçe
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  Switch,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Avatar,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShopOutlined,
  StarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [form] = Form.useForm();

  // Mock data - gerçek API ile değiştirilecek
  const mockRestaurants = [
    {
      _id: '1',
      ad: 'Seraser Fine Dining',
      kategori: 'Türk Mutfağı',
      puan: 4.8,
      konum: { mesafe: '1.2km', adres: 'Barbaros Mh., Antalya' },
      iletisim: { telefon: '+90 242 247 6015', eposta: 'info@seraser.com' },
      aktifMi: true,
      onerilenMi: true,
      paketSayisi: 5,
      toplamSiparis: 234,
      resimUrl: null
    },
    {
      _id: '2', 
      ad: 'Vanilla Lounge',
      kategori: 'Kahve & Atıştırmalık',
      puan: 4.6,
      konum: { mesafe: '0.8km', adres: 'Kaleiçi, Antalya' },
      iletisim: { telefon: '+90 242 241 6834', eposta: 'info@vanilla.com' },
      aktifMi: true,
      onerilenMi: false,
      paketSayisi: 3,
      toplamSiparis: 156,
      resimUrl: null
    }
  ];

  // Kategoriler
  const kategoriler = [
    'Türk Mutfağı',
    'Kahve & Atıştırmalık', 
    'Pizza & Fast Food',
    'Vegan & Sağlıklı',
    'Deniz Ürünleri',
    'Et & Kebap',
    'İtalyan Mutfağı'
  ];

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // Mock data - gerçek API çağrısı
      setTimeout(() => {
        setRestaurants(mockRestaurants);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Restoran verileri yüklenemedi');
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRestaurant(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRestaurant(record);
    form.setFieldsValue({
      ad: record.ad,
      kategori: record.kategori,
      aciklama: record.aciklama,
      adres: record.konum.adres,
      telefon: record.iletisim.telefon,
      eposta: record.iletisim.eposta,
      aktifMi: record.aktifMi,
      onerilenMi: record.onerilenMi
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      // API çağrısı
      setRestaurants(restaurants.filter(r => r._id !== id));
      message.success('Restoran başarıyla silindi');
    } catch (error) {
      message.error('Silme işlemi başarısız');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRestaurant) {
        // Güncelleme
        const updated = restaurants.map(r => 
          r._id === editingRestaurant._id ? { ...r, ...values } : r
        );
        setRestaurants(updated);
        message.success('Restoran başarıyla güncellendi');
      } else {
        // Yeni ekleme
        const newRestaurant = {
          _id: Date.now().toString(),
          ...values,
          puan: 4.0,
          paketSayisi: 0,
          toplamSiparis: 0
        };
        setRestaurants([...restaurants, newRestaurant]);
        message.success('Yeni restoran başarıyla eklendi');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('İşlem başarısız');
    }
  };

  // İstatistikler
  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter(r => r.aktifMi).length;
  const featuredRestaurants = restaurants.filter(r => r.onerilenMi).length;
  const avgRating = restaurants.length > 0 
    ? (restaurants.reduce((sum, r) => sum + r.puan, 0) / restaurants.length).toFixed(1)
    : 0;

  // Tablo kolonları
  const columns = [
    {
      title: 'Restoran',
      key: 'restoran',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            icon={<ShopOutlined />} 
            style={{ backgroundColor: '#16a34a' }}
            src={record.resimUrl}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.ad}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.kategori}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Puan',
      dataIndex: 'puan',
      key: 'puan',
      render: (puan) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{puan}</span>
        </Space>
      ),
      sorter: (a, b) => a.puan - b.puan
    },
    {
      title: 'Konum',
      key: 'konum',
      render: (_, record) => (
        <Tooltip title={record.konum.adres}>
          <Space>
            <EnvironmentOutlined />
            <span>{record.konum.mesafe}</span>
          </Space>
        </Tooltip>
      )
    },
    {
      title: 'İletişim',
      key: 'iletisim',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <PhoneOutlined />
            <span style={{ fontSize: '12px' }}>{record.iletisim.telefon}</span>
          </Space>
          <Space size="small">
            <MailOutlined />
            <span style={{ fontSize: '12px' }}>{record.iletisim.eposta}</span>
          </Space>
        </Space>
      )
    },
    {
      title: 'Durum',
      key: 'durum',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.aktifMi ? 'green' : 'red'}>
            {record.aktifMi ? 'Aktif' : 'Pasif'}
          </Tag>
          {record.onerilenMi && (
            <Tag color="gold">Önerilen</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'İstatistikler',
      key: 'stats',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span style={{ fontSize: '12px' }}>
            📦 {record.paketSayisi} Paket
          </span>
          <span style={{ fontSize: '12px' }}>
            🛒 {record.toplamSiparis} Sipariş
          </span>
        </Space>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Detayları Görüntüle">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => console.log('Detay:', record)}
            />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bu restoranı silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record._id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Tooltip title="Sil">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Sayfa Başlığı */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            🏪 Restoran Yönetimi
          </h1>
          <p style={{ margin: 0, color: '#666' }}>
            Sistemdeki tüm restoranları yönetin
          </p>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            Yeni Restoran Ekle
          </Button>
        </Col>
      </Row>

      {/* İstatistik Kartları */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Toplam Restoran"
              value={totalRestaurants}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Aktif Restoran"
              value={activeRestaurants}
              suffix={`/ ${totalRestaurants}`}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={totalRestaurants > 0 ? (activeRestaurants / totalRestaurants) * 100 : 0} 
              showInfo={false}
              strokeColor="#1890ff"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Önerilen Restoran"
              value={featuredRestaurants}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Ortalama Puan"
              value={avgRating}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Restoran Tablosu */}
      <Card
        title="Restoran Listesi"
        extra={
          <Space>
            <Button icon={<SearchOutlined />}>Ara</Button>
            <Button icon={<FilterOutlined />}>Filtrele</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={restaurants}
          rowKey="_id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} restoran`,
            pageSizeOptions: ['10', '20', '50']
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Restoran Ekleme/Düzenleme Modal */}
      <Modal
        title={editingRestaurant ? 'Restoran Düzenle' : 'Yeni Restoran Ekle'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="ad"
                label="Restoran Adı"
                rules={[{ required: true, message: 'Restoran adı zorunludur' }]}
              >
                <Input placeholder="Örn: Seraser Fine Dining" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="kategori"
                label="Kategori"
                rules={[{ required: true, message: 'Kategori seçiniz' }]}
              >
                <Select placeholder="Kategori seçiniz">
                  {kategoriler.map(k => (
                    <Option key={k} value={k}>{k}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="aciklama"
            label="Açıklama"
            rules={[{ required: true, message: 'Açıklama zorunludur' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Restoran hakkında açıklama yazınız..."
            />
          </Form.Item>

          <Form.Item
            name="adres"
            label="Adres"
            rules={[{ required: true, message: 'Adres zorunludur' }]}
          >
            <Input placeholder="Tam adres bilgisi" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="telefon"
                label="Telefon"
                rules={[{ required: true, message: 'Telefon zorunludur' }]}
              >
                <Input placeholder="+90 XXX XXX XX XX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="eposta"
                label="E-posta"
                rules={[
                  { required: true, message: 'E-posta zorunludur' },
                  { type: 'email', message: 'Geçerli e-posta adresi girin' }
                ]}
              >
                <Input placeholder="info@restoran.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="aktifMi"
                label="Durum"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Aktif"
                  unCheckedChildren="Pasif"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="onerilenMi"
                label="Önerilen Restoran"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Evet"
                  unCheckedChildren="Hayır"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="resimUrl"
            label="Restoran Fotoğrafı"
          >
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Fotoğraf Yükle</div>
              </div>
            </Upload>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRestaurant ? 'Güncelle' : 'Ekle'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RestaurantManagement;