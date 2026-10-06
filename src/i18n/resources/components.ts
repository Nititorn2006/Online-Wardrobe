export const componentResources = {
  en: {
    navigation: {
      home: "Home",
      tryOutfits: "Try",
      add: "Add",
      addClothes: "Add clothes",
      closet: "Closet",
      settings: "Settings",
    },
    components: {
      emptyCloset: {
        title: "Your closet is waiting",
        body: "Add a few favorite pieces and start building outfits that feel like you.",
        action: "Add clothing",
      },
      clothingCard: {
        opensDetails: "Opens clothing details",
        photo: "Photo of {{name}}",
        color: "Color: {{color}}",
        addFavorite: "Add {{name}} to favorites",
        removeFavorite: "Remove {{name}} from favorites",
      },
      colorPicker: {
        title: "Colors",
        close: "Close color picker",
        tabs: {
          grid: "Grid",
          spectrum: "Spectrum",
          sliders: "Sliders",
        },
        colorCell: "{{grid}} color, row {{row}}, column {{column}}",
        spectrumHint: "Tap anywhere in the spectrum to choose a shade.",
        channels: {
          hue: "Hue",
          saturation: "Saturation",
          value: "Brightness",
        },
        setChannel: "Set {{channel}} to {{value}}{{suffix}}",
        quickColors: "Quick colors",
        quickColor: "{{color}} quick color",
      },
      clothingColorPicker: {
        color: "{{color}} color",
        otherColors: "Other colors",
        other: "Other",
        modesHint: "Grid, spectrum, and sliders",
      },
    },
  },
  th: {
    navigation: {
      home: "หน้าหลัก",
      tryOutfits: "ลองชุด",
      add: "เพิ่ม",
      addClothes: "เพิ่มเสื้อผ้า",
      closet: "ตู้เสื้อผ้า",
      settings: "ตั้งค่า",
    },
    components: {
      emptyCloset: {
        title: "ตู้เสื้อผ้าของคุณกำลังรออยู่",
        body: "เพิ่มเสื้อผ้าชิ้นโปรด แล้วเริ่มจัดชุดในแบบที่เป็นคุณ",
        action: "เพิ่มเสื้อผ้า",
      },
      clothingCard: {
        opensDetails: "เปิดหน้ารายละเอียดเสื้อผ้า",
        photo: "รูปภาพของ {{name}}",
        color: "สี: {{color}}",
        addFavorite: "เพิ่ม {{name}} ในรายการโปรด",
        removeFavorite: "นำ {{name}} ออกจากรายการโปรด",
      },
      colorPicker: {
        title: "สี",
        close: "ปิดตัวเลือกสี",
        tabs: {
          grid: "ตารางสี",
          spectrum: "สเปกตรัม",
          sliders: "แถบเลื่อน",
        },
        colorCell: "{{grid}} แถวที่ {{row}} คอลัมน์ที่ {{column}}",
        spectrumHint: "แตะสีในสเปกตรัมเพื่อเลือกเฉดสี",
        channels: {
          hue: "เฉดสี",
          saturation: "ความอิ่มสี",
          value: "ความสว่าง",
        },
        setChannel: "ตั้งค่า{{channel}}เป็น {{value}}{{suffix}}",
        quickColors: "สีที่ใช้บ่อย",
        quickColor: "สี{{color}}ที่ใช้บ่อย",
      },
      clothingColorPicker: {
        color: "สี{{color}}",
        otherColors: "สีอื่น ๆ",
        other: "อื่น ๆ",
        modesHint: "ตารางสี สเปกตรัม และแถบเลื่อน",
      },
    },
  },
} as const;
