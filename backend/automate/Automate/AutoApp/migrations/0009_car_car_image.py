from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0008_routeusage_arrival_delta_min"),
    ]

    operations = [
        migrations.AddField(
            model_name="car",
            name="car_image",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]