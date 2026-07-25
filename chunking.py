def chunk_text(
        text:str, 
        chunk_size:int, 
        overlap:int
        
    )->list[str]:
    chunks=[]
    if overlap>=chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")
    if chunk_size<=0:
        raise ValueError("chunk size must be greater than 0")
    if not text:
        raise ValueError("length of text must be greater than 0")
    if overlap<0:
        raise ValueError("overlap must be greater than or equal to 0")
    for start in range(0, len(text), chunk_size-overlap):
        chunks.append(text[start:start+chunk_size])

    if len(chunks)>1 and len(chunks[-1])<0.5*chunk_size:
        last=chunks.pop()
        chunks[-1]+=last[overlap:] if overlap>0 else last

    return chunks
    

text='heymynameiskeerthanaui'
chunk_size=5
overlap=3
chunks=chunk_text(text, chunk_size,overlap)
print(chunks)
print(f"chunks size is {len(chunks)}")