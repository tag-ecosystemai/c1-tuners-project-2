# Building the pdf loader

import pymupdf

def load_pdf(file_path):
    doc = pymupdf.open(file_path)

    text = ""

    for page in doc:
        page_text = page.get_text()

        if page_text:
            text += page_text + "\n"

    doc.close()

    return text