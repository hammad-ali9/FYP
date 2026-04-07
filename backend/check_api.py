from gradio_client import Client
import sys
import io

try:
    print("Connecting to yisol/IDM-VTON...")
    client = Client("yisol/IDM-VTON")
    
    # Capture stdout to a string
    f = io.StringIO()
    sys.stdout = f
    client.view_api()
    sys.stdout = sys.__stdout__
    
    # Save to file with utf-8
    with open("api_schema_fixed.txt", "w", encoding="utf-8") as out:
        out.write(f.getvalue())
    print("API Schema saved to api_schema_fixed.txt")
except Exception as e:
    print(f"Error checking API: {e}", file=sys.stderr)
