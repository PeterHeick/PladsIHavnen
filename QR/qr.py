import qrcode
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk

class QRCodeGenerator:
    def __init__(self, master):
        self.master = master
        master.title("QR-kode Generator")

        self.text_input = tk.Entry(master, width=40)
        self.text_input.pack(pady=10)

        self.generate_button = tk.Button(master, text="Generer QR-kode", command=self.generate_qr_code)
        self.generate_button.pack(pady=5)

        self.qr_label = tk.Label(master)
        self.qr_label.pack(pady=10)

        self.save_button = tk.Button(master, text="Gem QR-kode", command=self.save_qr_code, state=tk.DISABLED)
        self.save_button.pack(pady=5)

        self.qr_image = None  # Holder det originale PIL Image-objekt

    def generate_qr_code(self):
        data = self.text_input.get()
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(data)
        qr.make(fit=True)
        self.qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Konverter PIL Image til PhotoImage for visning
        photo = ImageTk.PhotoImage(self.qr_image)
        self.qr_label.config(image=photo)
        self.qr_label.image = photo
        
        self.save_button.config(state=tk.NORMAL)

    def save_qr_code(self):
        if self.qr_image:
            file_path = filedialog.asksaveasfilename(defaultextension=".png")
            if file_path:
                self.qr_image.save(file_path)

root = tk.Tk()
qr_generator = QRCodeGenerator(root)
root.mainloop()
