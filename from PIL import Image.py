from PIL import Image

def recortar_objeto_cuadrado(input_path, output_path):
    # Abrir imagen en RGBA (necesario para transparencia)
    img = Image.open(input_path).convert("RGBA")
    
    # Obtener canal alfa (transparencia)
    alpha = img.split()[3]
    
    # Obtener bounding box del área no transparente
    bbox = alpha.getbbox()
    
    if not bbox:
        print("La imagen está completamente transparente.")
        return
    
    # Recortar al objeto
    recorte = img.crop(bbox)
    
    # Hacer el recorte cuadrado
    ancho, alto = recorte.size
    lado = max(ancho, alto)
    
    # Crear fondo transparente cuadrado
    cuadrado = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    
    # Centrar la imagen dentro del cuadrado
    x = (lado - ancho) // 2
    y = (lado - alto) // 2
    
    cuadrado.paste(recorte, (x, y), recorte)
    
    # Guardar resultado
    cuadrado.save(output_path)
    print("Imagen recortada y guardada en:", output_path)


# Uso
recortar_objeto_cuadrado("Solo_brazo_white_sin_fondo.png", "salida2.png")