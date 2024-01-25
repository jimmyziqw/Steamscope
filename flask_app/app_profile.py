
import cProfile
from app import app, index, get_app_summary

# Use the profile_decorator to profile any function
import cProfile

def profile_decorator(func):
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()
        profiler.dump_stats('get_app_summary.profile')
        return result
    return wrapper

# Create a new function that wraps the get_app_summary function with the decorator
@profile_decorator
def profiled_get_app_summary(*args, **kwargs):
    return get_app_summary(*args, **kwargs)

# Add a new route for the profiled function
app.add_url_rule('/profiled/<platform>/<id>', 'profiled_get_app_summary', profiled_get_app_summary, methods=["GET"])

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0', port=8080)


