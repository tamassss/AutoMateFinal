from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0012_car_car_image_readd"),
    ]

    operations = [
        migrations.AddField(
            model_name="routeusage",
            name="arrival_delta_min",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
