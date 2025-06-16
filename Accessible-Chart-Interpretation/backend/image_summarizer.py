import torch
from PIL import Image
from transformers import AutoModel, AutoTokenizer
from huggingface_hub import login
from HUGGINGFACE_HUB_TOKEN import HUGGINGFACE_HUB_TOKEN

# https://huggingface.co/openbmb/MiniCPM-V-2_6

login(HUGGINGFACE_HUB_TOKEN)

model = AutoModel.from_pretrained("openbmb/MiniCPM-V-2_6",
    trust_remote_code=True,
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True)
model = model.eval().cuda()
tokenizer = AutoTokenizer.from_pretrained('openbmb/MiniCPM-V-2_6', trust_remote_code=True)

image = Image.open('graph.png').convert('RGB')
question = 'What is in the image?'
msgs = [{'role': 'user', 'content': [image, question]}]

res = model.chat(
    image=None,
    msgs=msgs,
    tokenizer=tokenizer
)
print(res)

generated_text = ""
for new_text in res:
    generated_text += new_text
    print(new_text, flush=True, end='')