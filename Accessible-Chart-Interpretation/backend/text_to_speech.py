from gtts import gTTS
import pygame
import os
import time

pygame.mixer.init()

tts_filename = "./tts.mp3"
tts_text = "" # Store the text for repeat

def tts_play(text):
    global tts_text
    tts_text = text
    tts = gTTS(text, lang="en")
    tts.save(tts_filename)

    pygame.mixer.music.load(tts_filename)
    pygame.mixer.music.play()

def tts_pause():
    if pygame.mixer.music.get_busy():
        pygame.mixer.music.pause()

def tts_resume():
    if not pygame.mixer.music.get_busy():
        pygame.mixer.music.unpause()

def tts_skip():
    pygame.mixer.music.stop()
    if os.path.exists(tts_filename):
        os.remove(tts_filename)

def tts_repeat():
    if tts_text:
        tts_play(tts_text)

# Example usage
if __name__ == "__main__":
    tts_play("Hello, this is a test message. Hello, this is a test message. Hello, this is a test message. Hello, this is a test message. Hello, this is a test message.")
    time.sleep(2)
    
    tts_pause()
    print("Paused")

    time.sleep(2)
    tts_resume()
    print("Resumed")

    time.sleep(2)
    tts_skip()
    print("Skipped")

    time.sleep(1)
    tts_repeat()
    print("Repeated")